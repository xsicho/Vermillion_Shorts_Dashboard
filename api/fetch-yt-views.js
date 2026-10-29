export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ytUrl } = req.body;
  if (!ytUrl) return res.status(400).json({ error: 'Missing ytUrl parameter' });

  const match = ytUrl.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = match ? match[1] : null;

  if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL format' });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'YOUTUBE_API_KEY environment variable missing' });

  try {
    const apiRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`
    );
    const data = await apiRes.json();

    if (data.items && data.items.length > 0) {
      const views = parseInt(data.items[0].statistics.viewCount, 10) || 0;
      return res.status(200).json({ videoId, views });
    }

    return res.status(404).json({ error: 'Video not found' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
