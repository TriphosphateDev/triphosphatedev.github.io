export default {
  async fetch(request, env) {
    // Log request details
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers));

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

    // Check if this is the submit-form endpoint
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/submit-form')) {
      return new Response('Not Found', { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Method not allowed'
      }), { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    try {
      const formData = await request.formData();
      
      // Log form data
      console.log('Form data received:', Object.fromEntries(formData));

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
        formData: formData
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