// Mock global objects
globalThis.grecaptcha = {
  ready: (callback) => callback(),
  execute: jest.fn(() => Promise.resolve('test-token'))
};

globalThis.gtag_report_conversion = jest.fn();

// Mock fetch
globalThis.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ip: '127.0.0.1' })
  })
);

// Mock window.open
globalThis.window = {
  open: jest.fn()
}; 