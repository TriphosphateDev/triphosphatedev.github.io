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
      
      // Get client IP
      const clientIP = request.headers.get('cf-connecting-ip');

      // Honeypot check
      if (formData.get('u_verify')) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Unable to process request'
        }), { status: 400 });
      }

      // Check if this IP has already converted
      const previousConversion = await env.DB.prepare(
        "SELECT ip FROM conversion_tracking WHERE ip = ?"
      ).bind(clientIP).first();

      // Insert form data as normal
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

      // If it's a new conversion, track the IP
      if (!previousConversion) {
        await env.DB.prepare(
          "INSERT INTO conversion_tracking (ip) VALUES (?)"
        ).bind(clientIP).run();
      }

      // Return success with a flag indicating if this is a first-time conversion
      return new Response(JSON.stringify({
        status: 'success',
        isNewConversion: !previousConversion,
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