export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Handle POST requests
    if (request.method === "POST") {
      try {
        // Parse the request body
        const data = await request.json();

        // Check if this is a feedback form submission
        if (data.username && data.link) {
          // Validate the feedback input
          if (!data.username || !data.link) {
            return new Response(
              JSON.stringify({ error: "Username and link are required" }),
              {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              }
            );
          }

          // Insert the feedback into the database
          await env.DB.prepare(
            "INSERT INTO feedback (username, track_link) VALUES (?, ?)"
          )
            .bind(data.username, data.link)
            .run();

          // Return success response
          return new Response(
            JSON.stringify({ 
              status: "success", 
              message: "Feedback submitted successfully" 
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
        // Check if this is a consultation form submission
        else if (data.nameOrArtistName && data.email) {
          // Validate the consultation input
          if (!data.nameOrArtistName || !data.email || !data.contactPreference || !data.projectDescription) {
            return new Response(
              JSON.stringify({ error: "Required fields are missing" }),
              {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              }
            );
          }

          // Insert the consultation into the database
          await env.DB.prepare(
            "INSERT INTO consultations (name, email, phone, discord, contact_preference, project_description) VALUES (?, ?, ?, ?, ?, ?)"
          )
            .bind(
              data.nameOrArtistName,
              data.email,
              data.phone || null,
              data.discord || null,
              data.contactPreference,
              data.projectDescription
            )
            .run();

          // Return success response
          return new Response(
            JSON.stringify({ 
              status: "success", 
              message: "Consultation request submitted successfully",
              isNewConversion: true,
              conversionId: Date.now().toString()
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
        else {
          return new Response(
            JSON.stringify({ error: "Invalid form submission" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

      } catch (error) {
        // Log the error (will appear in Worker logs)
        console.error("Error processing request:", error);

        // Return error response
        return new Response(
          JSON.stringify({ 
            error: "Internal server error",
            details: error.message 
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // Handle unsupported methods
    return new Response("Method not allowed", { status: 405 });
  },
}; 