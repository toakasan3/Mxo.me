import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { room, userId, x, y, name, color } = body;
  const key = `presence:${room}:${userId}`;
  await redis.set(key, JSON.stringify({ userId, x, y, name, color }), { ex: 8 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  if (!room) return NextResponse.json([]);

  // Scan for keys matching presence:{room}:*
  const keys = await redis.keys(`presence:${room}:*`);
  if (!keys.length) return NextResponse.json([]);

  const values = await Promise.all(keys.map((k: string) => redis.get(k)));
  const cursors = values.filter(Boolean).map(v => typeof v === 'string' ? JSON.parse(v) : v);
  return NextResponse.json(cursors);
}
