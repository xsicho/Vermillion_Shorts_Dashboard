import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await redis.set('vermillion_scripts', req.body);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
