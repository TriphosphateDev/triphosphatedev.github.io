export async function submitToGoogleSheets(formData) {
    // Validate required fields
    const requiredFields = ['nameOrArtistName', 'email', 'contactPreference', 'projectDescription'];
    for (const field of requiredFields) {
        if (!formData.get(field)) {
            throw new Error('Missing required fields');
        }
    }

    // Submit to Google Sheets
    const response = await fetch(
        'https://script.google.com/macros/s/AKfycbx9P_NPnYmMaOBD6AFbbCDE6H3T4fR43GhbE0gUhlsTyemjqX-ku62o8VzOVepeDjnE7Q/exec',
        {
            method: 'POST',
            body: formData
        }
    );

    const result = await response.json();
    return result;
} 