import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/redis';

function sanitize(text: string): string {
  let result = text;
  let prev: string;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== prev);
  return result.slice(0, 1000);
}

export async function GET(req: NextRequest) {
  const board = req.nextUrl.searchParams.get('board');
  const x = req.nextUrl.searchParams.get('x');
  const y = req.nextUrl.searchParams.get('y');
  if (!board || x === null || y === null) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const { data, error } = await supabase
    .from('coord_replies')
    .select('*')
    .eq('board_code', board)
    .eq('coord_x', parseInt(x))
    .eq('coord_y', parseInt(y))
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('X-User-Id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { board_code, coord_x, coord_y, author_name, message } = body;

  if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  if (message.length > 1000) return NextResponse.json({ error: 'Message too long' }, { status: 400 });

  const rlKey = `rl:${userId}:coord:${board_code}:${coord_x}:${coord_y}`;
  const allowed = await checkRateLimit(rlKey, 10, 300);
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const clean = sanitize(message.trim());

  const { error } = await supabase.from('coord_replies').insert({
    board_code,
    coord_x: parseInt(coord_x),
    coord_y: parseInt(coord_y),
    author_id: userId,
    author_name: author_name || 'Anonymous',
    message: clean,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
