function doPost(e) {
    try {
        const data = e.parameter;
        
        // Verify Turnstile token
        const token = data['cf-turnstile-response'];
        if (!token) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Security verification failed'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        // Verify token with Cloudflare
        const cfResponse = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'post',
            payload: {
                secret: 'YOUR_SECRET_KEY',
                response: token
            }
        });
        
        const cfResult = JSON.parse(cfResponse.getContentText());
        if (!cfResult.success) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Security check failed'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        // Check honeypot
        if (data.hiddenHoneypotField) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Invalid submission'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        // Process form submission as before
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses");
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