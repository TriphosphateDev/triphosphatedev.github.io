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
        
        // Use JSONP directly
        return new Promise((resolve, reject) => {
            // Create unique callback name
            const callbackName = 'proxyCheckCallback_' + Math.random().toString(36).substr(2, 9);
            
            // Add callback to window
            window[callbackName] = (data) => {
                console.log('🔄 JSONP response received:', data);
                // Clean up
                delete window[callbackName];
                document.head.removeChild(script);
                resolve(data);
            };
            
            // Create script element
            const script = document.createElement('script');
            // Add callback parameter to URL
            const jsonpUrl = `${url}&callback=${callbackName}`;
            console.log('🔄 JSONP URL:', jsonpUrl);
            script.src = jsonpUrl;
            
            // Track if script was actually added
            let scriptAdded = false;
            
            script.onerror = (error) => {
                console.log('🚨 JSONP script error:', error);
                // Clean up
                delete window[callbackName];
                if (scriptAdded) {
                    document.head.removeChild(script);
                }
                
                // If script wasn't added or failed immediately, it's likely an adblocker
                console.log('🔍 JSONP error analysis:', { scriptAdded });
                
                // Always treat JSONP failures as blocking
                console.log('🛑 ADBLOCKER DETECTED via JSONP failure!');
                const err = new Error('ADBLOCKER_DETECTED');
                err.isAdblocker = true;
                reject(err);
            };
            
            // Add script to page
            try {
                document.head.appendChild(script);
                scriptAdded = true;
                console.log('📝 JSONP script added successfully');
            } catch (error) {
                console.log('❌ Failed to add JSONP script:', error);
                const err = new Error('ADBLOCKER_DETECTED');
                err.isAdblocker = true;
                reject(err);
            }
            
            // Set a timeout for the request
            setTimeout(() => {
                if (window[callbackName]) {
                    console.log('⏰ JSONP request timed out');
                    delete window[callbackName];
                    if (scriptAdded) {
                        document.head.removeChild(script);
                    }
                    const err = new Error('ADBLOCKER_DETECTED');
                    err.isAdblocker = true;
                    reject(err);
                }
            }, 5000); // 5 second timeout
        });
    } catch (error) {
        console.log('🚨 Raw error:', error);
        
        // If it's already identified as an adblocker error, re-throw
        if (error.isAdblocker) {
            throw error;
        }
        
        // Any error at this point is likely due to blocking
        console.log('🛑 ADBLOCKER DETECTED from general error!');
        const err = new Error('ADBLOCKER_DETECTED');
        err.isAdblocker = true;
        throw err;
    }
}

export async function validateIP(ip) {
    const API_KEY = config.PROXYCHECK_API_KEY || config.PROXYCHECK_PUBLIC_KEY;
    const data = await fetchWithRetry(
        `${config.PROXYCHECK_API_ENDPOINT}/${ip}?key=${API_KEY}&vpn=1&risk=1`
    );
    
    console.log('Proxycheck.io raw response:', data);
    
    // Handle API errors after all retries are exhausted
    if (data.status !== "ok") {
        throw new Error(`Proxycheck.io API error: ${data.message || 'Unknown error'}`);
    }

    const ipData = data[ip];
    if (!ipData) {
        throw new Error('Invalid IP address or no data returned');
    }

    // Make validation stricter
    const result = {
        isValid: !ipData.proxy && !ipData.vpn && (ipData.risk || 0) < 50,  // Lower risk threshold
        fraudScore: ipData.risk || 0,
        isProxy: ipData.proxy === "yes" || ipData.type === "Proxy",
        isVpn: ipData.type === "VPN"
    };

    // Track the result
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

// Add new function for early validation
export async function initializeSecurityButton(buttonId, defaultDestination) {
    try {
        console.log('🔍 Starting security button initialization...');
        const ip = await getUserIP();
        console.log('📍 Got IP:', ip);
        
        try {
            const validation = await validateIP(ip);
            if (!validation.isValid) {
                console.log('❌ Invalid IP detected');
                createButton(buttonId, './blocked.html');
                return false;
            }
            
            console.log('✅ IP validation passed');
            createButton(buttonId, defaultDestination);
            return true;
        } catch (error) {
            console.log('🔍 Checking error:', error);
            
            // More comprehensive error detection for different browsers
            const errorText = (error.toString() || '').toLowerCase();
            const messageText = (error.message || '').toLowerCase();
            const stackText = (error.stack || '').toLowerCase();
            
            // Check for any indication of blocked requests or network failures
            const isBlocked = 
                error.isAdblocker || 
                messageText === 'failed to fetch' ||
                errorText.includes('err_blocked') ||
                errorText.includes('err_failed') ||  // Chrome CORS error
                errorText.includes('cors') ||        // Explicit CORS mentions
                stackText.includes('proxycheck.io') ||
                // Opera specific checks
                errorText.includes('network_err');

            console.log('🔍 Error analysis:', { errorText, messageText, stackText, isBlocked });

            if (isBlocked) {
                console.log('🚫 Request blocked, creating adblocker button');
                createButton(buttonId, './adblocker.html');
                return false;
            }
            
            // Fallback for any other errors
            console.log('❌ Security check failed, creating adblocker button');
            createButton(buttonId, './adblocker.html');
            return false;
        }
    } catch (error) {
        console.error('❌ Security initialization error:', error);
        createButton(buttonId, './adblocker.html');
        return false;
    } finally {
        // Always ensure a button is created
        const button = document.getElementById(buttonId);
        if (button && (button.disabled || button.textContent.includes('Checking Security'))) {
            console.log('⚠️ Ensuring button is created in finally block');
            createButton(buttonId, './adblocker.html');
        }
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
        window.countdownTimer = null; // Prevent multiple clears
    }
    
    // Update button properties with a small delay to ensure smooth transition
    setTimeout(() => {
        button.className = 'btn';
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.disabled = false;
        
        // Always show "Get Your Free Consultation" regardless of destination
        button.textContent = 'Get Your Free Consultation';
        
        button.onclick = (e) => {
            e.preventDefault();
            window.location.href = destination;
        };
    }, 100); // Small delay for smoother transition
}

// Add validateIPAndRedirect export
export async function validateIPAndRedirect() {
    try {
        console.log('🔍 Starting IP validation...');
        const ip = await getUserIP();
        console.log('📍 Got IP:', ip);
        
        try {
            const validation = await validateIP(ip);
            
            // Store validation result
            sessionStorage.setItem('ipValidation', JSON.stringify({
                ip,
                result: validation,
                timestamp: Date.now()
            }));

            if (!validation.isValid) {
                console.log('❌ Invalid IP detected');
                window.location.replace('./blocked.html');
                return false;
            }
            
            return true;
        } catch (error) {
            if (error.isAdblocker || error.message === 'ADBLOCKER_DETECTED') {
                console.log('🚫 Adblocker detected');
                window.location.replace('./adblocker.html');
                return false;
            }
            throw error;
        }
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