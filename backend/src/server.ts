import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { pool } from './db/client.js';
import { authRouter } from './routes/auth.js';
import { gpsRouter } from './routes/gps.js';
import { healthRouter } from './routes/health.js';
import { iniciarServidorGT06 } from './gps-tracker/gt06.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '2mb' }));

app.use(healthRouter);
app.use(authRouter);
app.use(gpsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[ERROR]', message, err instanceof Error ? err.stack : '');
  if (!res.headersSent) {
    res.status(500).json({ error: 'Error interno del servidor.', detalle: message });
  }
});

const server = app.listen(config.port, () => {
  console.log(`API Don Ramón listening on :${config.port}`);
  iniciarServidorGT06(config.gt06Port);
});

process.on('SIGINT', async () => {
  server.close();
  await pool.end();
});
