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
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        // Log the error details
        console.log('🚨 Raw error:', error);
        console.log('🔍 Error type:', error.name);
        console.log('📝 Error message:', error.message);

        // Check for adblocker in multiple ways
        const errorString = error.toString().toLowerCase();
        const messageString = error.message.toLowerCase();
        const stackString = error.stack?.toLowerCase() || '';

        // Look for adblocker signatures in all error text
        const isAdblockerError = 
            errorString.includes('err_blocked_by_adblocker') ||
            messageString.includes('err_blocked_by_adblocker') ||
            stackString.includes('err_blocked_by_adblocker') ||
            // Add additional checks for failed fetch due to adblocker
            (messageString === 'failed to fetch' && 
             stackString.includes('proxycheck.io'));

        if (isAdblockerError) {
            console.log('🛑 ADBLOCKER DETECTED!');
            const error = new Error('ADBLOCKER_DETECTED');
            error.isAdblocker = true;  // Add a flag for easier checking
            throw error;
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
            // Check for adblocker more thoroughly
            if (error.isAdblocker || 
                error.message === 'ADBLOCKER_DETECTED' ||
                (error.message === 'Failed to fetch' && error.stack?.includes('proxycheck.io'))) {
                console.log('🚫 Adblocker detected');
                createButton(buttonId, './adblocker.html');
                return false;
            }
            // Don't create button on other errors
            console.log('❌ Security check failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Security initialization error:', error);
        // Don't create button on errors
        return false;
    }
}

function createButton(buttonId, destination) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error('Button element not found:', buttonId);
        return;
    }
    
    // Update button properties
    button.style.display = 'inline-block';
    button.disabled = false;
    button.textContent = destination.includes('adblocker') ? 'Please Disable Adblocker' :
                        destination.includes('blocked') ? 'Access Denied' :
                        'Get Your Free Consultation';
    
    button.onclick = (e) => {
        e.preventDefault();
        window.location.href = destination;
    };
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