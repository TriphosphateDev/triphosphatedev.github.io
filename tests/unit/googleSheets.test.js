import { submitToGoogleSheets } from '../../src/googleSheets';

describe('Google Sheets Integration', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock form data with all required fields
    global.formData = new FormData();
    global.formData.append('nameOrArtistName', 'Test Artist');
    global.formData.append('email', 'test@example.com');
    global.formData.append('contactPreference', 'Any time');
    global.formData.append('projectDescription', 'Test project');
    global.formData.append('userIP', '1.1.1.1');
    global.formData.append('recaptchaResponse', 'test-token');
  });

  test('successfully submits form data', async () => {
    // Mock successful submission
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ status: 'success' })
      })
    );

    const result = await submitToGoogleSheets(global.formData);
    expect(result.status).toBe('success');
  });

  test('handles submission errors', async () => {
    // Mock failed submission
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ 
          status: 'error',
          message: 'Duplicate submission detected'
        })
      })
    );

    const result = await submitToGoogleSheets(global.formData);
    expect(result.status).toBe('error');
    expect(result.message).toBe('Duplicate submission detected');
  });

  test('validates required fields', async () => {
    const incompleteData = new FormData();
    incompleteData.append('nameOrArtistName', 'Test Artist');
    // Missing email and other required fields

    await expect(submitToGoogleSheets(incompleteData))
      .rejects
      .toThrow('Missing required fields');
  });
}); 