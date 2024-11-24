export const config = {
    MONITORING: {
        RATE_LIMIT_THRESHOLD: 800, // 80% of daily limit
        ERROR_THRESHOLD: 0.05 // 5% error rate threshold
    }
};

// Create monitoring events
export function trackIPCheck(result) {
    // Check if gtag is available (i.e., we're in browser not test environment)
    if (typeof gtag === 'function') {
        gtag('event', 'ip_check', {
            'event_category': 'Security',
            'event_label': result.isValid ? 'clean_ip' : 'blocked_ip',
            'value': result.fraudScore
        });

        if (result.isProxy || result.isVpn) {
            gtag('event', 'proxy_detected', {
                'event_category': 'Security',
                'event_label': result.isVpn ? 'vpn' : 'proxy',
                'value': result.fraudScore
            });
        }
    } else {
        // In test environment, just log
        console.debug('Tracking IP check:', result);
    }
}

// Mock gtag for testing if needed
export function mockGtag() {
    if (typeof window !== 'undefined' && typeof gtag === 'undefined') {
        window.gtag = function(...args) {
            console.debug('Mock gtag called with:', args);
        };
    }
} 