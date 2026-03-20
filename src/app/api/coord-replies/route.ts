import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/redis';

const USER_ID_RE = /^[0-9a-f]{8}$/;
const BOARD_CODE_RE = /^[A-Z0-9_-]{6}$/;
const COORD_LIMIT = 10_000_000;

function isValidUserId(uid: string | null): uid is string {
  return !!uid && USER_ID_RE.test(uid);
}

function isValidBoardCode(code: string): boolean {
  return BOARD_CODE_RE.test(code);
}

function isValidCoord(value: string | null): boolean {
  if (value === null) return false;
  const n = parseInt(value, 10);
  return !isNaN(n) && Math.abs(n) <= COORD_LIMIT;
}

/**
 * Sanitize user-supplied message text.
 * Strips HTML tags (defense-in-depth) and null bytes, then truncates.
 */
function sanitize(text: string): string {
  let result = text;
  let prev: string;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== prev);
  // Remove null bytes and other control characters (except normal whitespace)
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return result.slice(0, 1000);
}

export async function GET(req: NextRequest) {
  const board = req.nextUrl.searchParams.get('board');
  const x = req.nextUrl.searchParams.get('x');
  const y = req.nextUrl.searchParams.get('y');

  if (!board || !isValidBoardCode(board)) return NextResponse.json({ error: 'Invalid board code' }, { status: 400 });
  if (!isValidCoord(x) || !isValidCoord(y)) return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });

  const { data, error } = await supabase
    .from('coord_replies')
    .select('*')
    .eq('board_code', board)
    .eq('coord_x', parseInt(x!))
    .eq('coord_y', parseInt(y!))
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('X-User-Id');
  if (!isValidUserId(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { board_code, coord_x, coord_y, author_name, message } = body;

  if (!board_code || !isValidBoardCode(String(board_code))) {
    return NextResponse.json({ error: 'Invalid board code' }, { status: 400 });
  }
  const cx = parseInt(String(coord_x), 10);
  const cy = parseInt(String(coord_y), 10);
  if (isNaN(cx) || isNaN(cy) || Math.abs(cx) > COORD_LIMIT || Math.abs(cy) > COORD_LIMIT) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  if (message.length > 1000) return NextResponse.json({ error: 'Message too long' }, { status: 400 });

  const rlKey = `rl:${userId}:coord:${board_code}:${cx}:${cy}`;
  const allowed = await checkRateLimit(rlKey, 10, 300);
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const clean = sanitize(message.trim());
  const safeName = typeof author_name === 'string'
    ? author_name.replace(/<[^>]*>/g, '').trim().slice(0, 50) || 'Anonymous'
    : 'Anonymous';

  const { error } = await supabase.from('coord_replies').insert({
    board_code: String(board_code),
    coord_x: cx,
    coord_y: cy,
    author_id: userId,
    author_name: safeName,
    message: clean,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
