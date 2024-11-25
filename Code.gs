function doPost(e) {
    try {
        var mainSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses");
        var data = e.parameter;
        
        // Keep honeypot check
        if (data.hiddenHoneypotField) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Spam detected'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        // Log submission (simplified)
        mainSheet.appendRow([
            new Date(),
            data.nameOrArtistName, 
            data.email, 
            data.phone || "N/A", 
            data.discord || "N/A", 
            data.contactPreference, 
            data.projectDescription
        ]);
        
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: 'Form submitted successfully'
        })).setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
} 