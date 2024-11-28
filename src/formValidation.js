import { submitToGoogleSheets } from './googleSheets.js';

// Form validation functions
export function validateFormSubmission(event) {
    const form = event.target;
    const requiredFields = ['nameOrArtistName', 'email', 'projectDescription'];
    
    // Check Turnstile token
    const token = turnstile.getResponse();
    if (!token) {
        throw new Error('Please complete the security check');
    }
    
    // Check required fields
    for (const fieldName of requiredFields) {
        const field = form.elements[fieldName];
        if (!field.value.trim()) {
            throw new Error(`Please fill out ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        }
    }
    return true;
}

// Form submission handler
export async function handleFormSubmit(event, formData) {
    event.preventDefault();
    
    try {
        if (!validateFormSubmission(event)) {
            return false;
        }

        // Add Turnstile token to formData
        const token = turnstile.getResponse();
        formData.append('cf-turnstile-response', token);

        // Submit to Worker
        const response = await fetch('/api/submit', {
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