import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  try {
    const scripts = await redis.get('vermillion_scripts');
    return res.status(200).json(scripts || []);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
