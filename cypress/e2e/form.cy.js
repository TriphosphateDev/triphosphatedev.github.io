describe('Consultation Form', () => {
  beforeEach(() => {
    // Mock initial IP fetch from ipify - update the URL pattern
    cy.intercept({
      method: 'GET',
      url: 'https://api.ipify.org/**',  // Use ** for any path after the domain
      query: {
        format: 'json'
      }
    }, {
      statusCode: 200,
      body: { ip: '1.1.1.1' }
    }).as('getIP');
    
    // Mock IP Quality Score API - update the URL pattern
    cy.intercept({
      method: 'GET',
      url: 'https://www.ipqualityscore.com/api/json/ip/**'
    }, {
      statusCode: 200,
      body: {
        success: true,
        fraud_score: 0,
        country_code: "US",
        proxy: false,
        vpn: false,
        tor: false
      }
    }).as('ipCheck');

    // Mock Google Sheets submission - update the URL pattern
    cy.intercept({
      method: 'POST',
      url: 'https://script.google.com/macros/s/**'
    }, {
      statusCode: 200,
      body: {
        status: 'success'
      }
    }).as('sheetSubmit');

    // Visit the form page
    cy.visit('/consultation.html');
    
    // Mock reCAPTCHA
    cy.window().then((win) => {
      win.grecaptcha = {
        ready: (callback) => callback(),
        execute: () => Promise.resolve('test-token')
      };
    });
  });

  it('blocks form submission without user interaction', () => {
    // Submit form without interaction
    cy.get('#consultationForm').submit();
    
    // Use cy.on to catch window.alert
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Please interact with the page before submitting');
    });
  });

  it('blocks suspicious IPs', () => {
    // Override IP Quality Score mock for suspicious IP
    cy.intercept('GET', 'https://www.ipqualityscore.com/api/json/ip/*', {
      statusCode: 200,
      body: {
        success: true,
        fraud_score: 85,
        proxy: true,
        vpn: true
      }
    }).as('badIpCheck');

    // Fill and submit form
    cy.get('body').trigger('mousemove');
    cy.fillFormFields();
    cy.get('#consultationForm').submit();
    
    // Check for alert message
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Access blocked: VPN or suspicious activity detected');
    });
  });

  it('successfully submits form with valid data', () => {
    // Simulate user interaction
    cy.get('body').trigger('mousemove');
    
    // Fill out form
    cy.fillFormFields();

    // Submit form
    cy.get('#consultationForm').submit();
    
    // Wait for both API calls in order
    cy.wait('@ipCheck');
    cy.wait('@sheetSubmit');
    
    // Verify redirect to success page
    cy.url().should('include', '/success.html');
  });

  it('handles Google Sheets submission error', () => {
    // Mock Google Sheets error
    cy.intercept('POST', 'https://script.google.com/macros/s/*', {
      statusCode: 200,
      body: {
        status: 'error',
        message: 'Duplicate submission detected'
      }
    }).as('sheetError');

    // Fill and submit form
    cy.get('body').trigger('mousemove');
    cy.fillFormFields();
    cy.get('#consultationForm').submit();
    
    // Check for alert message
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Duplicate submission detected');
    });
  });
});

// Custom command to fill form fields
Cypress.Commands.add('fillFormFields', () => {
  cy.get('#nameOrArtistName').type('Test Artist');
  cy.get('#email').type('test@example.com');
  cy.get('#phone').type('1234567890');
  cy.get('#discord').type('test#1234');
  cy.get('#contactPreference').type('Any time');
  cy.get('#projectDescription').type('Test project');
}); 