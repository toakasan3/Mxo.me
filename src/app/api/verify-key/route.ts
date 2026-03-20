import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sha256 } from '@/lib/hash';
import { checkRateLimit } from '@/lib/redis';

const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 60; // seconds

const REDIS_CONFIGURED =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== 'https://placeholder.upstash.io';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { elementId, key } = body;

  if (!elementId || typeof elementId !== 'string') {
    return NextResponse.json({ error: 'Missing elementId' }, { status: 400 });
  }
  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  // Rate-limit by elementId (requires Redis; silently skipped otherwise)
  if (REDIS_CONFIGURED) {
    try {
      const allowed = await checkRateLimit(`verify:${elementId}`, RATE_LIMIT_ATTEMPTS, RATE_LIMIT_WINDOW);
      if (!allowed) {
        return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
      }
    } catch {
      // Redis unavailable at runtime – continue without rate limiting
    }
  }

  const { data: element, error } = await supabase
    .from('elements')
    .select('key_hash, is_locked')
    .eq('id', elementId)
    .single();

  if (error || !element) {
    return NextResponse.json({ error: 'Element not found' }, { status: 404 });
  }

  if (!element.is_locked || !element.key_hash) {
    // Element is not locked – always succeeds
    return NextResponse.json({ success: true });
  }

  const inputHash = await sha256(key);
  return NextResponse.json({ success: inputHash === element.key_hash });
}
