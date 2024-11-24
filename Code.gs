function doPost(e) {
    try {
        var mainSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses");
        var ipSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("IP History");
        var data = e.parameter;
        
        // Check honeypot
        if (data.hiddenHoneypotField) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Spam detected'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Verify reCAPTCHA
        var recaptchaResponse = verifyRecaptcha(data.recaptchaResponse);
        if (!recaptchaResponse.success || recaptchaResponse.score < 0.5) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Invalid reCAPTCHA'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Check IP history
        var ipHistory = ipSheet.getDataRange().getValues();
        var userIP = data.userIP;
        var duplicateSubmission = false;
        
        for (var i = 0; i < ipHistory.length; i++) {
            if (ipHistory[i][0] === userIP && 
                new Date() - new Date(ipHistory[i][1]) < 24*60*60*1000) {
                duplicateSubmission = true;
                break;
            }
        }
        
        if (duplicateSubmission) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Duplicate submission detected'
            })).setMimeType(ContentService.MimeType.JSON);
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
            recaptchaResponse.score
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

function verifyRecaptcha(token) {
    var secret = "6LewkogqAAAAAETdsuvT-gdR24IDTtfEhV5DXljy";
    var url = "https://www.google.com/recaptcha/api/siteverify";
    
    var response = UrlFetchApp.fetch(url, {
        method: "POST",
        payload: {
            secret: secret,
            response: token
        }
    });
    
    return JSON.parse(response.getContentText());
} 