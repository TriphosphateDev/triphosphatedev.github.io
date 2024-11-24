import { submitToGoogleSheets } from './googleSheets.js';

// Form validation functions
export function validateFormSubmission(event, userInteracted) {
    if (!userInteracted) {
        window.alert('Please interact with the page before submitting');
        return false;
    }
    return true;
}

const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx9P_NPnYmMaOBD6AFbbCDE6H3T4fR43GhbE0gUhlsTyemjqX-ku62o8VzOVepeDjnE7Q/exec';

// Form submission handler
export async function handleFormSubmit(event, userInteracted, formData) {
    event.preventDefault();
    
    if (!validateFormSubmission(event, userInteracted)) {
        return false;
    }

    try {
        // Get reCAPTCHA token
        const token = await grecaptcha.execute('6LewkogqAAAAANUh-L1KOeelY9mBl2I6evdrhRAr', {action: 'submit'});
        formData.append('recaptchaResponse', token);
        
        // Check IP Quality Score
        const ipQualityResponse = await fetch(
            `https://www.ipqualityscore.com/api/json/ip/EdSmKQnDEO37q2o2TLzpG5y8ilpQ94ZB/${formData.get('userIP')}`
        );
        const ipData = await ipQualityResponse.json();

        if (ipData.proxy || ipData.vpn || ipData.fraud_score > 75) {
            window.alert('Access blocked: VPN or suspicious activity detected');
            return false;
        }

        // Submit to Google Sheets
        const response = await fetch(SHEETS_ENDPOINT, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            window.location.href = '/success.html';
            return true;
        } else {
            window.alert(result.message || 'An error occurred. Please try again.');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        window.alert('An error occurred. Please try again.');
        return false;
    }
} 