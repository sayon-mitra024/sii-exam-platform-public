exports.handler = async (event) => {
  const GAS_URL = process.env.GAS_URL;
  const SECRET_KEY = process.env.GAS_API_KEY;

  // Basic validation to ensure environment variables exist
  if (!GAS_URL || !SECRET_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Proxy Configuration Error: Missing Environment Variables" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    body.apiKey = SECRET_KEY; // Inject the hidden key 

    const response = await fetch(GAS_URL, {
      method: 'POST',
      redirect: 'follow', // Explicitly tell it to follow Google's redirects
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Google prefers text/plain for CORS-less POSTs
      body: JSON.stringify(body)
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error("Proxy Error:", error); // This shows up in Netlify Logs
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Proxy Failed: " + error.message })
    };
  }
};