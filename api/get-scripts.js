import { createClient } from 'redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = createClient({ url: process.env.REDIS_URL });

  try {
    await client.connect();
    const data = await client.get('vermillion_scripts');
    await client.disconnect();

    const scripts = data ? JSON.parse(data) : [];
    return res.status(200).json(scripts);
  } catch (error) {
    if (client.isOpen) await client.disconnect();
    console.error('Redis read error:', error);
    return res.status(500).json({ error: error.message });
  }
}
