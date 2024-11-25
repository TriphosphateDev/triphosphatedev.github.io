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
      // Parse JSON instead of FormData
      const data = await request.json();
      
      // Honeypot check
      if (data.hiddenHoneypotField) {
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
        formData: data
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