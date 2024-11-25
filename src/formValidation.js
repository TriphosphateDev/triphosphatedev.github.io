import { submitToGoogleSheets } from './googleSheets.js';

// Form validation functions
export function validateFormSubmission(event) {
    const form = event.target;
    const requiredFields = ['nameOrArtistName', 'email', 'projectDescription'];
    
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

        // Submit to Google Sheets
        const response = await submitToGoogleSheets(formData);
        
        if (response.status === 'success') {
            window.location.href = '/success.html';
            return true;
        } else {
            window.alert(response.message || 'An error occurred. Please try again.');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        window.alert('An error occurred. Please try again.');
        return false;
    }
} 