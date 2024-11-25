function doPost(e) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses");
        const data = e.parameter;
        
        // Check honeypot
        if (data.hiddenHoneypotField) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Invalid submission'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Invalid email address'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        // Log submission
        sheet.appendRow([
            new Date(),
            data.nameOrArtistName,
            data.email,
            data.phone || "N/A",
            data.discord || "N/A",
            data.contactPreference,
            data.projectDescription
        ]);
        
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success'
        })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
} 