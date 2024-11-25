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
            
            script.onerror = (error) => {
                console.log('🚨 JSONP script error:', error);
                // Clean up
                delete window[callbackName];
                document.head.removeChild(script);
                
                // More aggressive adblocker detection for JSONP
                const isBlocked = 
                    error.type === 'error' || 
                    !document.querySelector(`script[src*="proxycheck.io"]`) ||
                    document.querySelector(`script[src*="proxycheck.io"][src*="${callbackName}"]`) === null;
                
                console.log('🔍 JSONP block check:', { isBlocked, error });
                
                if (isBlocked) {
                    console.log('🛑 ADBLOCKER DETECTED via JSONP!');
                    const err = new Error('ADBLOCKER_DETECTED');
                    err.isAdblocker = true;
                    reject(err);
                } else {
                    reject(new Error('JSONP request failed'));
                }
            };
            
            // Set a timeout to detect blocking
            setTimeout(() => {
                if (!document.querySelector(`script[src*="${callbackName}"]`)) {
                    console.log('🛑 Script injection blocked - likely adblocker');
                    const err = new Error('ADBLOCKER_DETECTED');
                    err.isAdblocker = true;
                    reject(err);
                }
            }, 500);
            
            // Add script to page
            document.head.appendChild(script);
        });
    } catch (error) {
        console.log('🚨 Raw error:', error);
        
        // If it's already identified as an adblocker error, re-throw
        if (error.isAdblocker) {
            throw error;
        }
        
        // Check for other signs of blocking
        const errorText = error.toString().toLowerCase();
        const messageText = error.message.toLowerCase();
        const stackText = error.stack?.toLowerCase() || '';
        
        const isBlocked = 
            errorText.includes('err_blocked') ||
            messageText.includes('failed to load') ||
            messageText.includes('jsonp request failed') ||  // Add JSONP failure
            stackText.includes('proxycheck.io');
            
        if (isBlocked) {
            console.log('🛑 ADBLOCKER DETECTED!');
            const err = new Error('ADBLOCKER_DETECTED');
            err.isAdblocker = true;
            throw err;
        }

        throw error;
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