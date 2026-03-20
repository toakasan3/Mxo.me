import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/redis';
import { nanoid } from 'nanoid';

const USER_ID_RE = /^[0-9a-f]{8}$/;

function isValidUserId(uid: string | null): uid is string {
  return !!uid && USER_ID_RE.test(uid);
}

/** Strip HTML tags and limit length for board names. */
function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Untitled Board';
  return raw.replace(/<[^>]*>/g, '').trim().slice(0, 100) || 'Untitled Board';
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('X-User-Id');
  if (!isValidUserId(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: 10 board creations per user per hour
  const allowed = await checkRateLimit(`rl:boards:${userId}`, 10, 3600);
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });

  const body = await req.json();
  const name = sanitizeName(body.name);
  const code = nanoid(6).toUpperCase();

  const { error } = await supabase.from('boards').insert({
    code,
    name,
    owner_id: userId,
    is_private: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code });
}
