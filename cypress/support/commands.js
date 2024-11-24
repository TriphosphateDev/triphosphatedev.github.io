// Custom command to mock successful IP check
Cypress.Commands.add('mockGoodIP', () => {
  cy.intercept('GET', '**/ipqualityscore.com/api/**', {
    statusCode: 200,
    body: {
      success: true,
      fraud_score: 0,
      proxy: false,
      vpn: false
    }
  }).as('ipCheck');
});

// Custom command to mock bad IP
Cypress.Commands.add('mockBadIP', () => {
  cy.intercept('GET', '**/ipqualityscore.com/api/**', {
    statusCode: 200,
    body: {
      success: true,
      fraud_score: 100,
      proxy: true,
      vpn: true
    }
  }).as('ipCheck');
}); 