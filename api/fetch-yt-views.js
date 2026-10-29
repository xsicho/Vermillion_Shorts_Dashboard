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

    // Call official YouTube oEmbed API to verify video exists and gets official metadata
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!oembedRes.ok) {
      return res.status(404).json({ error: 'Video not found or private' });
    }

    const oembedData = await oembedRes.json();

    // Fetch view count from YouTube's public web page player JSON payload
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await pageRes.text();

    // Regex match for viewCount inside ytInitialData payload
    const viewMatch = html.match(/"viewCount":"(\d+)"/) || 
                      html.match(/"videoDetails":\{"videoId":"[^"]+","title":"[^"]+","lengthSeconds":"[^"]+","keywords":\[.*?\],"channelId":"[^"]+","isOwnerViewing":false,"shortDescription":"[^"]*","isCrawlable":true,"thumbnail":\{"thumbnails":\[.*?\]\},"allowRatings":true,"viewCount":"(\d+)"/);

    const views = viewMatch ? parseInt(viewMatch[1], 10) : 0;

    return res.status(200).json({ 
      videoId, 
      title: oembedData.title,
      author: oembedData.author_name,
      views 
    });
  } catch (error) {
    console.error('Error fetching YouTube view count:', error);
    return res.status(500).json({ error: error.message });
  }
}
