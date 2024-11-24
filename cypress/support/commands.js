// Custom command to mock successful IP check
Cypress.Commands.add('mockGoodIP', () => {
    // Mock initial IP fetch
    cy.intercept('GET', '**/api.ipify.org/**', {
        statusCode: 200,
        body: { ip: '1.1.1.1' }
    }).as('getIP');

    // Mock Proxycheck.io response
    cy.intercept('GET', '**/proxycheck.io/v2/**', {
        statusCode: 200,
        body: {
            status: "ok",
            "1.1.1.1": {
                proxy: "no",
                risk: 0,
                type: "residential"
            }
        }
    }).as('ipCheck');

    // Mock monitoring module
    cy.intercept('GET', '**/src/monitoring.js', {
        statusCode: 200,
        body: `
            export function trackIPCheck(result) {
                if (typeof gtag === 'function') {
                    gtag('event', 'ip_check', {
                        'event_category': 'Security',
                        'event_label': result.isValid ? 'clean_ip' : 'blocked_ip'
                    });
                }
            }
        `
    });
});

// Custom command to mock bad IP
Cypress.Commands.add('mockBadIP', () => {
    // Mock initial IP fetch
    cy.intercept('GET', '**/api.ipify.org/**', {
        statusCode: 200,
        body: { ip: '1.1.1.1' }
    }).as('getIP');

    // Make the pattern more permissive for Proxycheck.io
    cy.intercept('GET', '**/proxycheck.io/**', {
        statusCode: 200,
        body: {
            status: "ok",
            "1.1.1.1": {
                proxy: "yes",
                type: "VPN",
                risk: 85
            }
        }
    }).as('ipCheck');

    // Mock monitoring module
    cy.intercept('GET', '**/src/monitoring.js', {
        statusCode: 200,
        body: `
            export function trackIPCheck(result) {
                if (typeof gtag === 'function') {
                    gtag('event', 'ip_check', {
                        'event_category': 'Security',
                        'event_label': result.isValid ? 'clean_ip' : 'blocked_ip'
                    });
                }
            }
        `
    });
});

// Custom command to mock API error
Cypress.Commands.add('mockIPError', () => {
    // Mock initial IP fetch
    cy.intercept('GET', '**/api.ipify.org/**', {
        statusCode: 200,
        body: { ip: '1.1.1.1' }
    }).as('getIP');

    // Mock Proxycheck.io error response
    cy.intercept('GET', '**/proxycheck.io/v2/**', {
        statusCode: 429,
        body: {
            status: "error",
            message: "Rate limit exceeded"
        }
    }).as('ipCheck');
}); 