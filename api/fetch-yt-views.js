export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ytUrl } = req.body;
  if (!ytUrl) return res.status(400).json({ error: 'Missing ytUrl parameter' });

  try {
    // Extract YouTube Video / Short ID
    const match = ytUrl.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : null;

    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL format' });
    }

    // Fetch video page HTML
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();

    // Extract viewCount from YouTube meta tag or ytInitialData
    const viewMetaMatch = html.match(/<meta itemprop="interactionCount" content="(\d+)">/) ||
                          html.match(/"viewCount":"(\d+)"/);

    const views = viewMetaMatch ? parseInt(viewMetaMatch[1], 10) : 0;

    return res.status(200).json({ videoId, views });
  } catch (error) {
    console.error('Error scraping YouTube view count:', error);
    return res.status(500).json({ error: error.message });
  }
}
