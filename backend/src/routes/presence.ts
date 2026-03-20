import { Router, Request, Response } from 'express';
import { redis } from '../lib/redis';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const body = req.body as {
    room?: string;
    userId?: string;
    x?: number;
    y?: number;
    name?: string;
    color?: string;
  };
  const { room, userId, x, y, name, color } = body;
  if (!room || !userId) {
    res.json({ ok: true });
    return;
  }

  const dataKey = `presence:${room}:${userId}`;
  const setKey = `room-users:${room}`;

  await redis.set(dataKey, JSON.stringify({ userId, x, y, name, color }), { ex: 8 });
  await redis.sadd(setKey, userId);

  res.json({ ok: true });
});

router.get('/', async (req: Request, res: Response) => {
  const room = req.query.room as string | undefined;
  if (!room) {
    res.json([]);
    return;
  }

  const setKey = `room-users:${room}`;
  const userIds: string[] = await redis.smembers(setKey);
  if (!userIds.length) {
    res.json([]);
    return;
  }

  const pairs = await Promise.all(
    userIds.map(async (uid) => {
      const val = await redis.get(`presence:${room}:${uid}`);
      return { uid, val };
    })
  );

  const stale = pairs.filter(p => !p.val).map(p => p.uid);
  if (stale.length) await redis.srem(setKey, ...stale);

  const cursors = pairs
    .filter(p => p.val)
    .map(p => (typeof p.val === 'string' ? JSON.parse(p.val) : p.val));

  res.json(cursors);
});

export default router;
