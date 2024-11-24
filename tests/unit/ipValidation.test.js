import { validateIP, validateIPWithCache, validateIPAndRedirect, cache, MAX_RETRIES, INITIAL_RETRY_DELAY } from '../../src/ipValidation.js';
import { mockGtag } from '../../src/monitoring.js';

describe('IP Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        // Mock window.location
        const locationMock = { href: '' };
        Object.defineProperty(window, 'location', {
            value: locationMock,
            writable: true
        });
        // Mock sessionStorage
        global.sessionStorage = {
            setItem: jest.fn(),
            getItem: jest.fn()
        };
        // Mock gtag
        mockGtag();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('validateIPAndRedirect', () => {
        test('allows good IPs and stores validation', async () => {
            // Mock IP fetch
            global.fetch = jest.fn()
                .mockImplementationOnce(() => Promise.resolve({
                    json: () => Promise.resolve({ ip: '1.1.1.1' })
                }))
                .mockImplementationOnce(() => Promise.resolve({
                    json: () => Promise.resolve({
                        status: "ok",
                        "1.1.1.1": {
                            proxy: "no",
                            risk: 0
                        }
                    })
                }));

            const result = await validateIPAndRedirect();
            expect(result).toBe(true);
            expect(window.location.href).not.toBe('/blocked.html');
        });

        test('handles API errors gracefully', async () => {
            // Mock IP fetch with error that includes status
            global.fetch = jest.fn()
                .mockImplementationOnce(() => Promise.resolve({
                    json: () => Promise.resolve({ ip: '1.1.1.1' })
                }))
                .mockImplementationOnce(() => Promise.resolve({
                    json: () => Promise.resolve({
                        status: "error",
                        message: "API error"
                    })
                }));

            // Fast-forward timers after each retry
            for (let i = 0; i < MAX_RETRIES; i++) {
                jest.advanceTimersByTime(INITIAL_RETRY_DELAY * Math.pow(2, i));
            }

            const result = await validateIPAndRedirect();
            expect(result).toBe(true); // Allow access on error for better UX
            expect(window.location.href).not.toBe('/blocked.html');
        });
    });
}); 