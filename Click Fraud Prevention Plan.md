# Click Fraud Prevention Plan

## Overview
Multi-layered protection system to prevent fraudulent form submissions and click fraud while maintaining a smooth user experience.

## Security Layers

### 1. IP Quality Score Verification
**Purpose:** Block suspicious IPs and VPN users upfront
- **API Endpoint:** https://www.ipqualityscore.com/documentation/proxy-detection-api
- **API Key:** EdSmKQnDEO37q2o2TLzpG5y8ilpQ94ZB
- **Implementation:**
  - Client-side API call on page load
  - Block access if fraud score is below threshold
  - Block access if VPN detected
  - Use `user_activity` parameter for additional fraud detection

### 2. Google reCAPTCHA v3
**Purpose:** Invisible bot detection
- **Client Side Key:** 6LewkogqAAAAANUh-L1KOeelY9mBl2I6evdrhRAr
- **Server Side Key:** 6LewkogqAAAAAETdsuvT-gdR24IDTtfEhV5DXljy
- **Documentation:**
  - Implementation: https://developers.google.com/recaptcha/docs/v3
  - Verification: https://developers.google.com/recaptcha/docs/verify

### 3. Google Sheets Integration
**Purpose:** Form submission and IP tracking
- **Main Sheet:** Form responses
- **IP History Sheet:** Track submission IPs
- **Endpoint:** https://script.google.com/macros/s/AKfycbx9P_NPnYmMaOBD6AFbbCDE6H3T4fR43GhbE0gUhlsTyemjqX-ku62o8VzOVepeDjnE7Q/exec
- **Security Features:**
  - Honeypot field
  - Required user interaction (scroll/click)
  - IP submission history check
  - Timestamp logging

**Google Apps Script:**
```javascript
function doPost(e) {
    try {
        var mainSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses");
        var ipSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("IP History");
        var data = e.parameter;
        
        // Check honeypot
        if (data.hiddenHoneypotField) {
            return ContentService.createTextOutput("Spam detected.")
                               .setMimeType(ContentService.MimeType.TEXT);
        }

        // Check IP history
        var ipHistory = ipSheet.getDataRange().getValues();
        var userIP = data.userIP;
        
        for (var i = 0; i < ipHistory.length; i++) {
            if (ipHistory[i][0] === userIP) {
                return ContentService.createTextOutput("Duplicate submission.")
                                   .setMimeType(ContentService.MimeType.TEXT);
            }
        }
        
        // Log IP
        ipSheet.appendRow([userIP, new Date()]);
        
        // Log submission
        mainSheet.appendRow([
            new Date(),
            data.nameOrArtistName, 
            data.email, 
            data.phone || "N/A", 
            data.discord || "N/A", 
            data.contactPreference, 
            data.projectDescription,
            userIP,
            "Clean"
        ]);
        
        return ContentService.createTextOutput("Success")
                           .setMimeType(ContentService.MimeType.TEXT);
    } catch (error) {
        return ContentService.createTextOutput("Error: " + error.message)
                           .setMimeType(ContentService.MimeType.TEXT);
    }
}
```

### 4. Form Implementation
**Purpose:** Data collection with spam prevention
- **Security Features:**
  - Honeypot field
  - Required user interaction (scroll/click)
  - Client-side IP detection
  - Timestamp logging

**Form Template:**
```html
<form action="YOUR_WEB_APP_URL" method="POST" id="consultationForm">
    <label for="nameOrArtistName">Name or Artist Name:</label>
    <input type="text" id="nameOrArtistName" name="nameOrArtistName" required>
    
    <label for="email">E-mail:</label>
    <input type="email" id="email" name="email" required>
    
    <label for="phone">Phone (optional):</label>
    <input type="text" id="phone" name="phone">
    
    <label for="discord">Discord or other messaging services (optional):</label>
    <input type="text" id="discord" name="discord">
    
    <label for="contactPreference">When/How do you want me to contact you?</label>
    <textarea id="contactPreference" name="contactPreference" required></textarea>
    
    <label for="projectDescription">What project are we going to be working on?</label>
    <textarea id="projectDescription" name="projectDescription" required></textarea>
    
    <!-- Hidden IP field -->
    <input type="hidden" name="userIP" id="userIP">
    
    <!-- Honeypot Field -->
    <input type="text" name="hiddenHoneypotField" style="display:none;" tabindex="-1" autocomplete="off">
    
    <button type="submit">Submit</button>
</form>

<script>
// Get user IP using ipify API
fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => document.getElementById('userIP').value = data.ip);

// Track user interaction
let userInteracted = false;
document.addEventListener('mousemove', () => userInteracted = true);
document.addEventListener('scroll', () => userInteracted = true);

// Form submission handling
document.getElementById('consultationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userInteracted) {
        alert('Please interact with the page before submitting');
        return;
    }
    // Continue with submission...
});
</script>
```

### 5. Form Submission Flow
1. Client-side IP Quality Score check
2. Get user's IP address
3. Verify reCAPTCHA score
4. Check user interaction
5. Submit form with IP
6. Server-side IP history check
7. Log submission and IP
8. Redirect to thank you page

### 6. Conversion Tracking
**Purpose:** Track successful submissions
- Implement Google Ads conversion tracking on thank you page
- Log successful submissions in Google Sheet
- Include timestamp and IP details

## Testing Strategy

### 1. Local Development Testing
**Purpose:** Test functionality without live API calls
- Set up local test environment
- Mock API responses for:
  - IP Quality Score
  - reCAPTCHA v3
  - Google Sheets submissions
- Test user interaction tracking

### 2. Unit Testing (Jest)
**Purpose:** Test individual components
- Test form validation functions
- Test IP checking logic
- Test user interaction tracking
- Test honeypot functionality

### 3. Integration Testing (Cypress)
**Purpose:** Test full user flows
- Test form submission process
- Test reCAPTCHA integration
- Test conversion tracking
- Test redirect flows

### 4. Security Testing
**Purpose:** Verify security measures
- Test VPN detection
- Test bot prevention
- Test multiple submission blocking
- Test honeypot effectiveness

### 5. Test Implementation Steps
1. Set up testing environment
2. Create mock API responses
3. Write unit tests for each component
4. Create end-to-end test scenarios
5. Test in staging environment
6. Verify in production

## Implementation Order

### Phase 1: Testing Infrastructure
1. Set up Jest for unit testing
   - Test environment configuration
   - Mock API responses
   - Test utilities

2. Set up Cypress for integration testing
   - Test environment setup
   - Mock external services
   - Test scenarios definition

3. Create test suites for:
   - IP Quality Score validation
   - reCAPTCHA verification
   - Form submission process
   - User interaction tracking
   - Google Sheets integration
   - Conversion tracking

### Phase 2: Component Implementation
1. Implement reCAPTCHA with tests
2. Implement IP Quality Score with tests
3. Create form page with tests
4. Set up Google Sheets integration with tests
5. Create thank you page with tests

### Phase 3: Integration
1. Combine all components
2. Run full test suite
3. Deploy to staging
4. Verify in production

## Implementation Checklist
- [ ] Set up Jest testing environment
- [ ] Set up Cypress testing environment
- [ ] Create mock API responses
- [ ] Write initial test suites
- [ ] Set up Google Sheets with IP History sheet
- [ ] Implement IP Quality Score client-side check
- [ ] Set up reCAPTCHA v3
- [ ] Create form page with IP detection
- [ ] Implement user interaction tracking
- [ ] Create thank you page with conversion tracking
- [ ] Test all security layers

