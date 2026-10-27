import { createClient } from 'redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const client = createClient({ url: process.env.REDIS_URL });

  try {
    await client.connect();
    await client.set('vermillion_scripts', JSON.stringify(req.body));
    await client.disconnect();

    return res.status(200).json({ success: true });
  } catch (error) {
    if (client.isOpen) await client.disconnect();
    console.error('Redis write error:', error);
    return res.status(500).json({ error: error.message });
  }
}
