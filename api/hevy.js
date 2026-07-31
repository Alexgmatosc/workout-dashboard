export default async function handler(req, res) {
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
