import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export { app };
