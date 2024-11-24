describe('Consultation Form', () => {
  beforeEach(() => {
    // Mock reCAPTCHA
    cy.window().then((win) => {
      win.grecaptcha = {
        ready: (callback) => callback(),
        execute: () => Promise.resolve('test-token')
      };
      // Mock gtag for monitoring
      win.gtag = (...args) => {
        console.log('Mock gtag called with:', args);
      };
    });
  });

  it('blocks access with VPN/proxy IP', () => {
    cy.log('Setting up intercepts for VPN test');
    cy.mockBadIP();
    
    // Mock monitoring events
    cy.window().then((win) => {
      cy.spy(win, 'gtag').as('gtagSpy');
    });
    
    cy.visit('/consultation.html');
    
    // Log network requests for debugging
    cy.on('fail', (error, runnable) => {
      console.log('Failed waiting for ipCheck');
      console.log('Network requests:', error.message);
    });
    
    // Wait for IP check to complete with longer timeout
    cy.wait('@ipCheck', { timeout: 10000 }).then((interception) => {
      cy.log('IP check response:', interception.response.body);
    });
    
    // Wait for redirection and verify blocked page
    cy.url({ timeout: 10000 }).should('include', 'blocked.html');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Access Denied');
    
    // Verify monitoring event was fired
    cy.get('@gtagSpy').should('be.calledWith', 
      'event', 
      'proxy_detected',
      Cypress.sinon.match({
        event_category: 'Security',
        event_label: 'vpn'
      })
    );
  });

  it('allows access with clean IP', () => {
    cy.log('Setting up intercepts for clean IP test');
    cy.mockGoodIP();
    
    cy.visit('/consultation.html');
    
    // Should show form
    cy.get('#consultationForm').should('be.visible');
  });

  it('handles API errors gracefully', () => {
    cy.log('Setting up intercepts for error test');

    // Mock IP fetch - more permissive pattern
    cy.intercept('**/api.ipify.org/**', {
      statusCode: 200,
      body: { ip: '1.1.1.1' }
    }).as('getIP');

    // Mock module import with error
    cy.intercept('GET', '**/src/ipValidation.js', {
      statusCode: 200,
      body: `
        export const validateIPWithCache = async () => {
          throw new Error('API error');
        };
      `
    });

    cy.log('Visiting page');
    cy.visit('/consultation.html');

    // Wait for page load and IP fetch
    cy.get('#consultationForm').should('be.visible');
    cy.get('#userIP').should('exist');

    cy.log('Filling form');
    cy.get('#nameOrArtistName').type('Test Artist');
    cy.get('#email').type('test@example.com');
    cy.get('#projectDescription').type('Test project');
    cy.get('#contactPreference').type('Any time');

    cy.log('Submitting form');
    cy.get('#consultationForm').submit();

    cy.log('Checking error message');
    cy.on('window:alert', (text) => {
      expect(text).to.contains('An error occurred. Please try again.');
    });
  });
});