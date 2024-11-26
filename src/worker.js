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
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();
      console.log('Form data received:', Object.fromEntries(formData));

      // Get client IP
      const clientIP = request.headers.get('cf-connecting-ip');
      console.log('Client IP:', clientIP);

      // Honeypot check
      if (formData.get('u_verify')) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Unable to process request'
        }), { status: 400 });
      }

      // Check for previous conversion
      console.log('Checking for previous conversion...');
      const previousConversion = await env.DB.prepare(
        "SELECT ip FROM conversion_tracking WHERE ip = ?"
      ).bind(clientIP).first();
      console.log('Previous conversion check result:', previousConversion);

      // Insert form submission
      console.log('Starting D1 database insertion...');
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

      // Track new conversion
      if (!previousConversion) {
        console.log('Tracking new conversion for IP:', clientIP);
        await env.DB.prepare(
          "INSERT INTO conversion_tracking (ip) VALUES (?)"
        ).bind(clientIP).run();
        console.log('Conversion tracked successfully');
      }

      // Return response
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
      console.error('Error:', error);
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