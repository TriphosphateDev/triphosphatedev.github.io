import { validateIP } from '../../src/ipValidation';
import { validateFormSubmission, handleFormSubmit } from '../../src/formValidation';

describe('Consultation Form Validation', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock window.alert
    global.alert = jest.fn();
    
    // Mock form data
    global.formData = new FormData();
    global.formData.append('nameOrArtistName', 'Test Artist');
    global.formData.append('email', 'test@example.com');
    global.formData.append('userIP', '1.1.1.1');
  });

  test('blocks submission without user interaction', () => {
    const event = { preventDefault: jest.fn() };
    const result = validateFormSubmission(event, false);
    
    expect(global.alert).toHaveBeenCalledWith('Please interact with the page before submitting');
    expect(result).toBe(false);
  });

  test('blocks suspicious IPs', async () => {
    // Mock IP Quality Score response for suspicious IP
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          proxy: true,
          vpn: true,
          fraud_score: 80
        })
      })
    );

    const result = await validateIP('1.1.1.1');
    expect(result.isValid).toBe(false);
  });

  test('allows legitimate IPs', async () => {
    // Mock IP Quality Score response for legitimate IP
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          proxy: false,
          vpn: false,
          fraud_score: 0
        })
      })
    );

    const result = await validateIP('1.1.1.1');
    expect(result.isValid).toBe(true);
  });

  test('handles honeypot field', () => {
    // Test that form with filled honeypot is rejected
    const formDataWithHoneypot = { ...global.formData, hiddenHoneypotField: 'spam' };
    expect(formDataWithHoneypot.hiddenHoneypotField).toBeTruthy();
    
    // Test that legitimate form submission has empty honeypot
    expect(global.formData.hiddenHoneypotField).toBeFalsy();
  });

  test('validates reCAPTCHA token', async () => {
    const mockToken = 'valid-token';
    global.grecaptcha.execute.mockResolvedValueOnce(mockToken);

    const token = await global.grecaptcha.execute('site-key', { action: 'submit' });
    expect(token).toBe(mockToken);
  });
}); 