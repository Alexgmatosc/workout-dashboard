export default async function handler(req, res) {
  const authTokens = (process.env.AUTH_TOKENS || process.env.VITE_AUTH_TOKENS || '').split(',').map(t => t.trim()).filter(Boolean);
  
  if (authTokens.length > 0) {
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=')));
    const tokenInCookie = cookies['workout_auth'];
    const tokenInQuery = req.query.token;
    const tokenInHeader = req.headers['x-auth-token'];
    
    const providedToken = tokenInCookie || tokenInQuery || tokenInHeader;
    if (!providedToken || !authTokens.includes(providedToken)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const path = req.query.path || '';
  const apiKey = process.env.VITE_HEVY_API_KEY || process.env.HEVY_API_KEY || '';
  const targetUrl = `https://api.hevyapp.com/${path}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Hevy API Error: ${response.statusText}` });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
