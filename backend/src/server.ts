import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { pool } from './db/client.js';
import { authRouter } from './routes/auth.js';
import { cargasRouter } from './routes/cargas.js';
import { clientesRouter } from './routes/clientes.js';
import { estadisticasRouter } from './routes/estadisticas.js';
import { gpsRouter } from './routes/gps.js';
import { healthRouter } from './routes/health.js';
import { resesRouter } from './routes/reses.js';
import { usuariosRouter } from './routes/usuarios.js';
import { ventasRouter } from './routes/ventas.js';
import { iniciarServidorGT06 } from './gps-tracker/gt06.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '2mb' }));

app.use(healthRouter);
app.use(authRouter);
app.use(gpsRouter);
app.use(resesRouter);
app.use(clientesRouter);
app.use(ventasRouter);
app.use(usuariosRouter);
app.use(estadisticasRouter);
app.use(cargasRouter);

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
