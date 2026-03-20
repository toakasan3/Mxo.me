import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export async function GET(req: NextRequest) {
  const board = req.nextUrl.searchParams.get('board');
  if (!board) return NextResponse.json({ error: 'Missing board' }, { status: 400 });
  const { data, error } = await supabase.from('elements').select('*').eq('board_code', board).eq('deleted', false);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('X-User-Id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const id = nanoid();
  const { error } = await supabase.from('elements').insert({
    id,
    board_code: body.board_code,
    type: body.type,
    x: body.x,
    y: body.y,
    data: body.data,
    author_id: userId,
    deleted: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id });
}

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get('X-User-Id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { id, ...updates } = body;
  const { error } = await supabase.from('elements').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
