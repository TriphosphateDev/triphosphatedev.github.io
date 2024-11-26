// Define the sendEmail function before using it
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

// Create the Worker object
const worker = {
  async fetch(request, env) {
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
      const formData = await request.formData();
      console.log('Received form data:', Object.fromEntries(formData));
      
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

// Export the worker
export default worker; 