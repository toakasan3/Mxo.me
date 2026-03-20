import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const board = req.query.board as string | undefined;
  if (!board) {
    res.status(400).json({ error: 'Missing board' });
    return;
  }

  const { data, error } = await supabase
    .from('elements')
    .select('*')
    .eq('board_code', board)
    .eq('deleted', false);

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
    board_code: string;
    type: string;
    x: number;
    y: number;
    data: Record<string, unknown>;
  };
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

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ id });
});

router.patch('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const { id, ...updates } = body;
  const { error } = await supabase
    .from('elements')
    .update(updates)
    .eq('id', id as string);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ ok: true });
});

export default router;
