import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// We maintain a Redis Set `room-users:{room}` containing all active userIds for the room.
// Each user's cursor data is stored at `presence:{room}:{userId}` with an 8s TTL.
// On GET we read the set members, fetch each key, and remove stale members whose keys have expired.

const BOARD_CODE_RE = /^[A-Z0-9_-]{6}$/;
const USER_ID_RE = /^[0-9a-f]{8}$/;
const COORD_LIMIT = 10_000_000;

function isFiniteCoord(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= COORD_LIMIT;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { room, userId, x, y, name, color } = body;

  // Validate required fields to prevent junk data in Redis
  if (!room || !BOARD_CODE_RE.test(String(room))) return NextResponse.json({ ok: true });
  if (!userId || !USER_ID_RE.test(String(userId))) return NextResponse.json({ ok: true });
  if (!isFiniteCoord(x) || !isFiniteCoord(y)) return NextResponse.json({ ok: true });

  const safeName = typeof name === 'string' ? name.slice(0, 50) : 'Unknown';
  const safeColor = typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#4ECDC4';

  const dataKey = `presence:${room}:${userId}`;
  const setKey = `room-users:${room}`;

  // Store cursor data with 8s TTL
  await redis.set(dataKey, JSON.stringify({ userId, x, y, name: safeName, color: safeColor }), { ex: 8 });
  // Track userId in the room set (no TTL on the set itself — we clean stale members on GET)
  await redis.sadd(setKey, userId);

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  if (!room || !BOARD_CODE_RE.test(room)) return NextResponse.json([]);

  const setKey = `room-users:${room}`;
  const userIds: string[] = await redis.smembers(setKey);
  if (!userIds.length) return NextResponse.json([]);

  // Fetch cursor data for each tracked user
  const pairs = await Promise.all(
    userIds.map(async (uid) => {
      const val = await redis.get(`presence:${room}:${uid}`);
      return { uid, val };
    })
  );

  // Remove stale members from the set (their TTL-ed keys have expired)
  const stale = pairs.filter(p => !p.val).map(p => p.uid);
  if (stale.length) await redis.srem(setKey, ...stale);

  const cursors = pairs
    .filter(p => p.val)
    .map(p => (typeof p.val === 'string' ? JSON.parse(p.val) : p.val));

  return NextResponse.json(cursors);
}
