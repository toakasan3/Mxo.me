import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = req.body as { name?: string };
  const code = nanoid(6).toUpperCase();
  const { error } = await supabase.from('boards').insert({
    code,
    name: body.name || 'Untitled Board',
    owner_id: userId,
    is_private: false,
  });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ code });
});

export default router;
