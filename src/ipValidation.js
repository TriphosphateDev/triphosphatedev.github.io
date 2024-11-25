import { trackIPCheck } from '../src/monitoring.js';
import { config } from '../src/config.js';

console.log('Loading ipValidation module...');
// Make cache accessible for testing
export const cache = new Map();
export const MAX_RETRIES = 3; // Export for testing
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Retry configuration
export const INITIAL_RETRY_DELAY = 1000; // 1 second

export async function getUserIP() {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
}

async function fetchWithRetry(url) {
    try {
        console.log(`🔄 Fetching ${url}`);
        
        return new Promise((resolve, reject) => {
            const callbackName = 'proxyCheckCallback_' + Math.random().toString(36).substr(2, 9);
            let responseReceived = false;
            let jsonpResponse = null;
            
            // Extract IP from URL for use in response
            const ipMatch = url.match(/\/v2\/([^?]+)/);
            const ip = ipMatch ? ipMatch[1] : null;
            
            // Create a single timeout for the entire request
            const responseTimeout = setTimeout(() => {
                if (!responseReceived) {
                    console.log('⚠️ JSONP request timed out');
                    // Clean up
                    delete window[callbackName];
                    if (document.head.contains(script)) {
                        document.head.removeChild(script);
                    }
                    // Use safe default
                    resolve({
                        status: "ok",
                        [ip]: {
                            proxy: "no",
                            type: "residential",
                            risk: 0,
                            provider: "Unknown (Timeout)"
                        }
                    });
                }
            }, 10000); // 10 second timeout per API docs
            
            window[callbackName] = (data) => {
                clearTimeout(responseTimeout);
                console.log('🔄 JSONP response received:', data);
                responseReceived = true;
                jsonpResponse = data;
                
                // Clean up
                delete window[callbackName];
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
                
                resolve(data);
            };
            
            const script = document.createElement('script');
            
            script.onerror = (error) => {
                clearTimeout(responseTimeout);
                console.log('🚨 JSONP script error:', error);
                
                // Clean up script but keep callback for potential late response
                try {
                    document.head.removeChild(script);
                } catch (e) {
                    console.log('Script already removed');
                }
                
                // Check if this was an adblocker block
                const errorText = error.toString().toLowerCase();
                const isAdblockerBlock = 
                    errorText.includes('ad_blocker') ||
                    errorText.includes('adblocker');
                
                if (isAdblockerBlock) {
                    console.log('🛑 ADBLOCKER DETECTED!');
                    const err = new Error('ADBLOCKER_DETECTED');
                    err.isAdblocker = true;
                    reject(err);
                } else {
                    // If not an adblocker, try to resolve with default safe response
                    console.log('⚠️ JSONP failed but not adblocker, using default response');
                    resolve({
                        status: "ok",
                        [ip]: {
                            proxy: "no",
                            type: "residential",
                            risk: 0,
                            provider: "Unknown (Error)"
                        }
                    });
                }
            };
            
            // Format URL for JSONP
            const baseUrl = url.split('?')[0];
            const params = new URLSearchParams(url.split('?')[1]);

            // Add JSONP specific parameters in the correct order
            const jsonpParams = new URLSearchParams();
            jsonpParams.set('key', params.get('key')); // Key must be first
            jsonpParams.set('tag', 'callback');  // Required by ProxyCheck
            jsonpParams.set('callback', callbackName);
            // Add remaining parameters
            for (const [key, value] of params.entries()) {
                if (key !== 'key' && key !== 'tag' && key !== 'callback') {
                    jsonpParams.set(key, value);
                }
            }

            // Construct final URL with parameters in correct order
            const jsonpUrl = `${baseUrl}?${jsonpParams.toString()}`;
            console.log('🔄 JSONP URL:', jsonpUrl);
            script.src = jsonpUrl;
            
            try {
                document.head.appendChild(script);
                console.log('📝 JSONP script added successfully');
            } catch (error) {
                console.log('❌ Failed to add JSONP script:', error);
                reject(error);
            }
        });
    } catch (error) {
        console.log('🚨 Raw error:', error);
        throw error;
    }
}

export async function validateIP(ip) {
    const API_KEY = config.PROXYCHECK_API_KEY || config.PROXYCHECK_PUBLIC_KEY;
    
    // Build URL properly with all parameters at once
    const params = new URLSearchParams({
        key: API_KEY,
        vpn: '1',
        risk: '1',
        asn: '1',
        days: '7',    // Cache results for 7 days
        detailed: '1'  // Get detailed response
    });
    
    // Construct base URL without query parameters
    const baseUrl = `${config.PROXYCHECK_API_ENDPOINT}/${ip}`;
    
    // Combine URL and parameters
    const fullUrl = `${baseUrl}?${params.toString()}`;
    
    console.log('🔄 Constructed URL:', fullUrl);
    
    const data = await fetchWithRetry(fullUrl);
    console.log('Proxycheck.io raw response:', data);
    
    // Handle API errors
    if (data.status !== "ok") {
        throw new Error(`Proxycheck.io API error: ${data.message || 'Unknown error'}`);
    }

    // ProxyCheck.io returns the IP data in a nested object
    const ipData = data[ip];
    if (!ipData) {
        throw new Error('Invalid IP address or no data returned');
    }

    console.log('🔍 Full IP data details:', ipData);

    // Parse response according to API docs
    const result = {
        isValid: !(
            ipData.proxy === "yes" || 
            ipData.type?.toLowerCase() === "vpn" || 
            (ipData.risk || 0) >= 50
        ),
        fraudScore: ipData.risk || 0,
        isProxy: ipData.proxy === "yes",
        isVpn: ipData.type?.toLowerCase() === "vpn",
        // Include all available fields
        country: ipData.country,
        isp: ipData.provider || ipData.organisation,
        asn: ipData.asn,
        type: ipData.type,
        provider: ipData.provider,
        organisation: ipData.organisation,
        region: ipData.region,
        city: ipData.city,
        range: ipData.range,
        devices: ipData.devices
    };

    // Log detailed validation results
    console.log('🔍 Validation details:', {
        proxyStatus: ipData.proxy,
        connectionType: ipData.type,
        riskScore: ipData.risk,
        provider: ipData.provider,
        organisation: ipData.organisation,
        isValid: result.isValid,
        reason: result.isValid ? 'IP Passed' : 
                result.isProxy ? `Proxy Detected (${ipData.provider})` :
                result.isVpn ? `VPN Detected (${ipData.provider})` :
                `High Risk Score (${ipData.risk})`
    });

    // Track the result with more details
    trackIPCheck(result);
    console.log('Validation result:', result);

    return result;
}

export async function validateIPWithCache(ip) {
    const cached = cache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    const result = await validateIP(ip);
    cache.set(ip, {
        timestamp: Date.now(),
        data: result
    });
    return result;
}

// Add a new function to handle the initial check and store result
export async function performInitialValidation() {
    try {
        const ip = await getUserIP();
        const validation = await validateIP(ip);
        
        // Store validation result in sessionStorage
        sessionStorage.setItem('ipValidation', JSON.stringify({
            ip,
            result: validation,
            timestamp: Date.now()
        }));
        
        return validation;
    } catch (error) {
        console.error('Initial validation failed:', error);
        throw error;
    }
}

// Update initializeSecurityButton to use cached result
export async function initializeSecurityButton(buttonId, defaultDestination) {
    try {
        console.log('🔍 Starting security button initialization...');
        
        // Try to get cached validation result
        const cached = sessionStorage.getItem('ipValidation');
        let validation;
        
        if (cached) {
            const { result, timestamp } = JSON.parse(cached);
            // Use cached result if less than 5 minutes old
            if (Date.now() - timestamp < 5 * 60 * 1000) {
                validation = result;
                console.log('Using cached validation result');
            }
        }
        
        // If no valid cached result, perform validation
        if (!validation) {
            validation = await performInitialValidation();
        }
        
        // Rest of the function remains the same...
        console.log('🔍 Security check result:', {
            validation,
            isValid: validation.isValid,
            isProxy: validation.isProxy,
            isVpn: validation.isVpn,
            fraudScore: validation.fraudScore
        });
        
        if (!validation.isValid) {
            console.log('❌ Invalid IP detected - VPN or Proxy');
            createButton(buttonId, './blocked.html');
            return false;
        }
        
        console.log('✅ IP validation passed - creating consultation button');
        createButton(buttonId, defaultDestination);
        return true;
    } catch (error) {
        console.error('❌ Security initialization error:', error);
        // Only redirect to adblocker page if it's actually an adblocker
        if (error.message?.toLowerCase().includes('adblocker')) {
            createButton(buttonId, './adblocker.html');
        } else {
            createButton(buttonId, defaultDestination);
        }
        return false;
    }
}

function createButton(buttonId, destination) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error('Button element not found:', buttonId);
        return;
    }
    
    // Clear any existing countdown
    if (window.countdownTimer) {
        clearInterval(window.countdownTimer);
        window.countdownTimer = null;
    }
    
    console.log('🔄 Creating button with destination:', destination);
    
    // Update button properties after a longer delay to ensure JSONP completed
    setTimeout(() => {
        button.className = 'btn';
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.disabled = false;
        
        // Always show "Get Your Free Consultation"
        button.textContent = 'Get Your Free Consultation';
        
        button.onclick = (e) => {
            e.preventDefault();
            console.log('🔄 Button clicked, navigating to:', destination);
            window.location.href = destination;
        };
    }, 500); // Increased delay to 500ms
}

// Update validateIPAndRedirect to use cached result
export async function validateIPAndRedirect() {
    try {
        const cached = sessionStorage.getItem('ipValidation');
        if (cached) {
            const { result, timestamp } = JSON.parse(cached);
            // Use cached result if less than 5 minutes old
            if (Date.now() - timestamp < 5 * 60 * 1000) {
                if (!result.isValid) {
                    window.location.replace('./blocked.html');
                    return false;
                }
                return true;
            }
        }
        
        // If no valid cached result, perform new validation
        const validation = await performInitialValidation();
        
        if (!validation.isValid) {
            window.location.replace('./blocked.html');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ IP validation error:', error);
        // Check for adblocker more thoroughly
        if (error.isAdblocker || 
            error.message === 'ADBLOCKER_DETECTED' ||
            (error.message === 'Failed to fetch' && error.stack?.includes('proxycheck.io'))) {
            console.log('🚫 Adblocker detection handled at top level');
            window.location.replace('./adblocker.html');
            return false;
        }
        return false; // Don't allow access on errors
    }
} 