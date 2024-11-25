export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();
      
      // Honeypot check
      if (formData.get('hiddenHoneypotField')) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Invalid submission'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Format email content
      const emailContent = `
New consultation request:

Name: ${formData.get('nameOrArtistName')}
Email: ${formData.get('email')}
Phone: ${formData.get('phone') || 'Not provided'}
Discord: ${formData.get('discord') || 'Not provided'}
Contact Preference: ${formData.get('contactPreference')}
Project Description: ${formData.get('projectDescription')}
      `.trim();

      // Send email via Mailchannels
      await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ 
            to: [{ email: env.NOTIFICATION_EMAIL }] 
          }],
          from: { 
            email: 'noreply@tripmixes.com',
            name: 'Triphosphate Music Form'
          },
          subject: 'New Consultation Request',
          content: [{
            type: 'text/plain',
            value: emailContent
          }]
        })
      });

      return new Response(JSON.stringify({
        status: 'success'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
}; 