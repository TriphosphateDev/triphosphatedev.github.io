export function validateAndTrackClick(element, event) {
    event.preventDefault();
    
    return new Promise((resolve) => {
        grecaptcha.ready(function() {
            grecaptcha.execute('6LewkogqAAAAANUh-L1KOeelY9mBl2I6evdrhRAr', {action: 'contact_click'})
            .then(function(token) {
                // Report conversion to Google Ads
                gtag_report_conversion(element.href);
                
                // Proceed with navigation after short delay
                setTimeout(function() {
                    window.open(element.href, element.target || '_self');
                    resolve(true);
                }, 300);
            });
        });
    });
} 