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

async function fetchWithRetry(url, retryCount = 0) {
    try {
        console.log(`🔄 Attempt ${retryCount + 1}: Fetching ${url}`);
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        // Log the raw error first
        console.log('🚨 Raw error:', error);
        console.log('🔍 Error type:', error.name);
        console.log('📝 Error message:', error.message);
        console.log('🔗 Error stack:', error.stack);

        // Check for adblocker in multiple ways
        const errorText = error.toString().toLowerCase();
        const errorMsg = error.message.toLowerCase();
        const isAdblockerError = 
            errorText.includes('err_blocked_by_adblocker') || 
            errorMsg.includes('err_blocked_by_adblocker') ||
            errorText.includes('net::err_blocked_by_adblocker');

        if (isAdblockerError) {
            console.log('🛑 ADBLOCKER DETECTED!');
            // Immediately prevent further execution
            window.location.replace('./adblocker.html');
            return false;
        }

        // Only retry if it's not an adblocker error
        if (retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            console.log(`⏳ Waiting ${delay}ms before retry ${retryCount + 1}/${MAX_RETRIES}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, retryCount + 1);
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
                console.log('❌ Invalid IP detected, redirecting...');
                window.location.replace('./blocked.html');
                return false;
            }
            
            console.log('✅ IP validation passed');
            return true;
        } catch (error) {
            // Check if this was an adblocker error
            if (error === false) {
                console.log('🚫 Adblocker detection handled, stopping execution');
                return false;
            }
            throw error;
        }
    } catch (error) {
        console.error('❌ IP validation error:', error);
        // Allow access on other errors for better UX
        return true;
    }
} 