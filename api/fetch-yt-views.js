export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ytUrl, videoId: providedId } = req.body || {};
  if (!ytUrl && !providedId) return res.status(400).json({ error: 'Missing ytUrl or videoId parameter' });

  const match = (ytUrl || '').match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = providedId || (match ? match[1] : null);

  if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL format' });

  try {
    // If YOUTUBE_API_KEY is available in Vercel environment variables, use the official API
    if (process.env.YOUTUBE_API_KEY) {
      try {
        const apiRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
        );
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.items && apiData.items.length > 0) {
            const views = parseInt(apiData.items[0].statistics.viewCount, 10) || 0;
            return res.status(200).json({ videoId, views });
          }
        }
      } catch (e) {
        console.warn('YouTube API call failed, falling back to web scraper:', e.message);
      }
    }

    // Scrape view count directly from the public YouTube watch page
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await pageRes.text();

    const viewMatch = html.match(/"viewCount":"(\d+)"/) || 
                      html.match(/<meta itemprop="interactionCount" content="(\d+)">/) ||
                      html.match(/"viewCount":\s*"?(\d+)"?/);

    const views = viewMatch ? parseInt(viewMatch[1], 10) : 0;
    return res.status(200).json({ videoId, views });
  } catch (error) {
    console.error('Error fetching YouTube views:', error);
    return res.status(500).json({ error: error.message });
  }
}
