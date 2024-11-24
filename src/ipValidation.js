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
        const response = await fetch(url);
        const data = await response.json();
        
        // Only retry on rate limit errors
        if (data.status === "error" && 
            data.message?.toLowerCase().includes("rate limit") && 
            retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, retryCount + 1);
        }
        
        // If we've hit max retries or it's not a rate limit error, return the data
        return data;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, retryCount + 1);
        }
        throw error;
    }
}

import { trackIPCheck } from '/repository-name/src/monitoring.js';
import { config } from '/repository-name/src/config.js';

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
        console.log('Starting IP validation...');
        const ip = await getUserIP();
        console.log('Got IP:', ip);
        const validation = await validateIP(ip);
        console.log('Validation result:', validation);
        
        // Store validation result
        sessionStorage.setItem('ipValidation', JSON.stringify({
            ip,
            result: validation,
            timestamp: Date.now()
        }));

        if (!validation.isValid) {
            console.log('Invalid IP detected, redirecting...');
            window.location.href = '/blocked.html';
            return false;
        }
        
        console.log('IP validation passed');
        return true;
    } catch (error) {
        console.error('IP validation error:', error);
        // Allow access on error for better UX
        return true;
    }
} 