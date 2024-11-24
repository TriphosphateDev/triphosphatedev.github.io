import { validateAndTrackClick } from '../../src/validation';

describe('validateAndTrackClick', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock window.open
    window.open = jest.fn();
  });

  test('prevents default event behavior', () => {
    const event = {
      preventDefault: jest.fn()
    };
    const element = {
      href: 'https://example.com'
    };

    validateAndTrackClick(element, event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  test('executes reCAPTCHA verification', async () => {
    const element = {
      href: 'https://example.com'
    };
    const event = {
      preventDefault: jest.fn()
    };

    const promise = validateAndTrackClick(element, event);
    
    await expect(promise).resolves.toBe(true);
    expect(global.grecaptcha.execute).toHaveBeenCalledWith(
      '6LewkogqAAAAANUh-L1KOeelY9mBl2I6evdrhRAr',
      {action: 'contact_click'}
    );
  });

  test('calls gtag_report_conversion with correct href', async () => {
    const element = {
      href: 'https://example.com'
    };
    const event = {
      preventDefault: jest.fn()
    };

    await validateAndTrackClick(element, event);
    expect(global.gtag_report_conversion).toHaveBeenCalledWith('https://example.com');
  });
}); 