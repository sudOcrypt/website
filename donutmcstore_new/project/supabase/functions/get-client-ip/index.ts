import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Extract IP from various possible headers
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnecting = req.headers.get("cf-connecting-ip");
    
    // x-forwarded-for can contain multiple IPs, get the first one (original client)
    const ip = forwarded?.split(',')[0].trim() || realIp || cfConnecting || 'Unknown';
    
    // Get user agent as well
    const userAgent = req.headers.get("user-agent") || 'Unknown';

    return new Response(
      JSON.stringify({
        ip,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error getting client IP:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to get client info",
        ip: 'Unknown',
        user_agent: 'Unknown',
      }),
      {
        status: 200, // Still return 200 so login doesn't fail
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
