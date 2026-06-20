import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, signToken } from '../auth.js';
import { pool } from '../db/client.js';

const loginSchema = z.object({
  usuario: z.string().trim().min(2),
  pin: z.string().trim().length(4),
});

export const authRouter = Router();

authRouter.post('/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload inválido.' });
    return;
  }
  const { usuario, pin } = parsed.data;
  const id = usuario.toLowerCase();

  const existente = await pool.query<{ nombre: string; rol: 'admin' | 'operador'; activo: boolean; pin: string }>(
    `select nombre, rol, activo, pin from usuarios where id = $1`,
    [id]
  );
  if ((existente.rowCount ?? 0) === 0) {
    res.status(401).json({ error: 'Usuario no encontrado. Pedile al administrador que te cree un acceso.' });
    return;
  }
  const row = existente.rows[0];
  if (!row.activo) {
    res.status(403).json({ error: 'Usuario inactivo. Contactá al administrador.' });
    return;
  }
  if (pin !== row.pin) {
    res.status(401).json({ error: 'PIN inválido.' });
    return;
  }

  const token = signToken({ sub: id, nombre: row.nombre, rol: row.rol });
  res.json({ token, usuario: { id, nombre: row.nombre, rol: row.rol, activo: row.activo } });
});

authRouter.get('/auth/me', requireAuth, async (req, res) => {
  const user = (req as { user?: { sub: string; nombre: string; rol: 'admin' | 'operador' } }).user;
  if (!user?.sub) {
    res.status(401).json({ error: 'Token inválido.' });
    return;
  }
  const db = await pool.query<{ id: string; nombre: string; rol: 'admin' | 'operador'; activo: boolean }>(
    `select id, nombre, rol, activo from usuarios where id = $1`,
    [user.sub]
  );
  if ((db.rowCount ?? 0) > 0) {
    const row = db.rows[0];
    if (!row.activo) {
      res.status(403).json({ error: 'Usuario inactivo.' });
      return;
    }
    res.json({ usuario: row });
    return;
  }
  res.json({ usuario: { id: user.sub, nombre: user.nombre, rol: user.rol, activo: true } });
});
