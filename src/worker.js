export default {
  async fetch(request, env) {
    console.log('Worker started processing request');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
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
      console.log('Form data received:', Object.fromEntries(formData));

      // Updated honeypot check
      if (formData.get('u_verify')) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Unable to process request'
        }), { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          }
        });
      }

      // Log D1 operation start
      console.log('Starting D1 database insertion...');

      // Insert into D1 database
      const result = await env.DB.prepare(`
        INSERT INTO submissions (
          name_or_artist_name,
          email,
          phone,
          discord,
          contact_preference,
          project_description
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        formData.get('nameOrArtistName'),
        formData.get('email'),
        formData.get('phone') || null,
        formData.get('discord') || null,
        formData.get('contactPreference'),
        formData.get('projectDescription')
      ).run();

      console.log('Database insertion result:', result);
      
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