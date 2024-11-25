// Add the sendEmail function
async function sendEmail({ to, subject, formData }) {
  return fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
        },
      ],
      from: {
        email: 'noreply@tripmixes.com',
        name: 'Consultation Form',
      },
      subject: subject,
      content: [
        {
          type: 'text/plain',
          value: `
New consultation request:
Name: ${formData.nameOrArtistName}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}
Discord: ${formData.discord || 'Not provided'}
Contact Preference: ${formData.contactPreference}
Project Description: ${formData.projectDescription}
          `.trim()
        },
      ],
    }),
  });
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    try {
      // Parse form data
      const formData = await request.formData();
      console.log('Received form data:', Object.fromEntries(formData));
      
      // Honeypot check
      if (formData.get('hiddenHoneypotField')) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Invalid submission'
        }), { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          }
        });
      }

      // Send email notification
      await sendEmail({
        to: env.NOTIFICATION_EMAIL,
        subject: 'New Consultation Request',
        formData: Object.fromEntries(formData)
      });
      
      return new Response(JSON.stringify({
        status: 'success'
      }), { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        message: error.message
      }), { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }
  }
}; 