import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { checkRateLimit } from '../lib/redis';

const router = Router();

function sanitize(text: string): string {
  let result = text;
  let prev: string;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== prev);
  return result.slice(0, 1000);
}

router.get('/', async (req: Request, res: Response) => {
  const board = req.query.board as string | undefined;
  const x = req.query.x as string | undefined;
  const y = req.query.y as string | undefined;

  if (!board || x === undefined || y === undefined) {
    res.status(400).json({ error: 'Missing params' });
    return;
  }

  const { data, error } = await supabase
    .from('coord_replies')
    .select('*')
    .eq('board_code', board)
    .eq('coord_x', parseInt(x))
    .eq('coord_y', parseInt(y))
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data ?? []);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = req.body as {
    board_code?: string;
    coord_x?: number;
    coord_y?: number;
    author_name?: string;
    message?: string;
  };
  const { board_code, coord_x, coord_y, author_name, message } = body;

  if (!message?.trim()) {
    res.status(400).json({ error: 'Empty message' });
    return;
  }
  if (message.length > 1000) {
    res.status(400).json({ error: 'Message too long' });
    return;
  }

  const rlKey = `rl:${userId}:coord:${board_code}:${coord_x}:${coord_y}`;
  const allowed = await checkRateLimit(rlKey, 10, 300);
  if (!allowed) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  const clean = sanitize(message.trim());

  const { error } = await supabase.from('coord_replies').insert({
    board_code,
    coord_x: Number(coord_x),
    coord_y: Number(coord_y),
    author_id: userId,
    author_name: author_name || 'Anonymous',
    message: clean,
  });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ ok: true });
});

export default router;
