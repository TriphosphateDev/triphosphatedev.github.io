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
        // Parse the request body based on content type
        let data;
        const contentType = request.headers.get("content-type") || "";
        console.log('Received request with content-type:', contentType); // Debug log

        if (contentType.includes("application/json")) {
          data = await request.json();
          console.log('Parsed JSON data:', data); // Debug log
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          data = Object.fromEntries(formData.entries());
          console.log('Parsed form data:', data); // Debug log
        } else {
          console.error('Unsupported content type:', contentType); // Debug log
          return new Response(
            JSON.stringify({ 
              error: "Unsupported Content-Type",
              message: "Please use application/json, application/x-www-form-urlencoded, or multipart/form-data"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        // Check if this is a feedback form submission
        if (data.username && data.link) {
          console.log('Processing feedback form submission'); // Debug log
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
          console.log('Processing consultation form submission'); // Debug log
          // Validate the consultation input
          if (!data.nameOrArtistName || !data.email || !data.contactPreference || !data.projectDescription) {
            console.error('Missing required fields:', data); // Debug log
            return new Response(
              JSON.stringify({ 
                error: "Required fields are missing",
                details: "Please fill in all required fields"
              }),
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
            "INSERT INTO submissions (name_or_artist_name, email, phone, discord, contact_preference, project_description) VALUES (?, ?, ?, ?, ?, ?)"
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
          console.error('Invalid form submission data:', data); // Debug log
          return new Response(
            JSON.stringify({ 
              error: "Invalid form submission",
              details: "The submitted data does not match any known form type"
            }),
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
            details: error.message,
            stack: error.stack // Only in development
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