import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health';
import boardsRouter from './routes/boards';
import elementsRouter from './routes/elements';
import presenceRouter from './routes/presence';
import coordRepliesRouter from './routes/coord-replies';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/elements', elementsRouter);
app.use('/api/presence', presenceRouter);
app.use('/api/coord-replies', coordRepliesRouter);

app.listen(PORT, () => {
  console.log(`Backend API server running on http://localhost:${PORT}`);
});

export default app;
