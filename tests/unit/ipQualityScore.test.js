import { validateIP } from '../../src/ipValidation.js';

describe('IP Quality Score Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks high fraud score IPs', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          fraud_score: 85,
          proxy: true,
          vpn: true
        })
      })
    );

    const result = await validateIP('1.1.1.1');
    expect(result.isValid).toBe(false);
  });

  test('allows legitimate IPs', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          fraud_score: 0,
          proxy: false,
          vpn: false
        })
      })
    );

    const result = await validateIP('1.1.1.1');
    expect(result.isValid).toBe(true);
  });
}); 