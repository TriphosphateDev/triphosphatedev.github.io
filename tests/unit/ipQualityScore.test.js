import { validateIP, validateIPWithCache, cache, MAX_RETRIES } from '../../src/ipValidation.js';
import { mockGtag } from '../../src/monitoring.js';

describe('IP Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        // Mock gtag
        mockGtag();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('blocks proxy IPs', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    status: "ok",
                    "1.1.1.1": {
                        proxy: "yes",
                        type: "VPN",
                        risk: 85
                    }
                })
            })
        );

        const result = await validateIP('1.1.1.1');
        expect(result.isValid).toBe(false);
        expect(result.isProxy).toBe(true);
        expect(result.isVpn).toBe(true);
    });

    test('allows legitimate IPs', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    status: "ok",
                    "1.1.1.1": {
                        proxy: "no",
                        risk: 0
                    }
                })
            })
        );

        const result = await validateIP('1.1.1.1');
        expect(result.isValid).toBe(true);
        expect(result.isProxy).toBe(false);
        expect(result.isVpn).toBe(false);
    });

    test('handles API errors', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    status: "error",
                    message: "Invalid API key"
                })
            })
        );

        await expect(validateIP('1.1.1.1')).rejects.toThrow('Proxycheck.io API error: Invalid API key');
    }, 10000);

    test('caches IP validation results', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    status: "ok",
                    "1.1.1.1": {
                        proxy: "no",
                        risk: 0
                    }
                })
            })
        );

        const result1 = await validateIPWithCache('1.1.1.1');
        const result2 = await validateIPWithCache('1.1.1.1');

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(result1).toEqual(result2);
    });
});

describe('IP Validation with Retry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        cache.clear();
        // Mock gtag
        mockGtag();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('retries on rate limit error', async () => {
        let attempts = 0;
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => {
                    attempts++;
                    if (attempts < 2) {
                        return Promise.resolve({
                            status: "error",
                            message: "rate limit exceeded"
                        });
                    }
                    return Promise.resolve({
                        status: "ok",
                        "1.1.1.1": {
                            proxy: "no",
                            risk: 0
                        }
                    });
                }
            })
        );

        const promise = validateIP('1.1.1.1');
        await jest.runAllTimersAsync();
        const result = await promise;
        
        expect(attempts).toBe(2);
        expect(result.isValid).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    }, 10000);

    test('gives up after max retries', async () => {
        let attempts = 0;
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => {
                    attempts++;
                    return Promise.resolve({
                        status: "error",
                        message: "rate limit exceeded"
                    });
                }
            })
        );

        const promise = validateIP('1.1.1.1');
        
        // Run all timers for each retry attempt
        for (let i = 0; i <= MAX_RETRIES; i++) {
            await jest.runAllTimersAsync();
        }
        
        await expect(promise).rejects.toThrow('Proxycheck.io API error: rate limit exceeded');
        expect(attempts).toBe(4); // Initial try + 3 retries
    }, 15000);

    test('caches successful responses', async () => {
        const mockFetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    status: "ok",
                    "1.1.1.1": {
                        proxy: "no",
                        risk: 0
                    }
                })
            })
        );
        global.fetch = mockFetch;

        const result1 = await validateIPWithCache('1.1.1.1');
        const result2 = await validateIPWithCache('1.1.1.1');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result1).toEqual(result2);
    });

    test('cache expires after duration', async () => {
        const mockFetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    status: "ok",
                    "1.1.1.1": {
                        proxy: "no",
                        risk: 0
                    }
                })
            })
        );
        global.fetch = mockFetch;

        const result1 = await validateIPWithCache('1.1.1.1');
        
        jest.advanceTimersByTime(1000 * 60 * 60 + 1);
        
        const result2 = await validateIPWithCache('1.1.1.1');

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result1).toEqual(result2);
    });
}); 