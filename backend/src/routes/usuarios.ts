import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../auth.js';
import { pool } from '../db/client.js';

export const usuariosRouter = Router();

// GET /admin/usuarios — lista de usuarios del sistema (sin exponer el PIN)
usuariosRouter.get('/admin/usuarios', requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await pool.query(
    `select id, nombre, rol, activo from usuarios order by nombre`
  );
  res.json({ usuarios: rows });
});

const crearUsuarioSchema = z.object({
  id: z.string().trim().min(2),
  nombre: z.string().trim().min(2),
  pin: z.string().trim().length(4),
  rol: z.enum(['admin', 'operador']),
});

// POST /admin/usuarios — alta de usuario
usuariosRouter.post('/admin/usuarios', requireAuth, requireAdmin, async (req, res) => {
  const parsed = crearUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }
  const { id, nombre, pin, rol } = parsed.data;
  const idNormalizado = id.toLowerCase();

  const existente = await pool.query('select id from usuarios where id = $1', [idNormalizado]);
  if (existente.rows.length > 0) {
    res.status(409).json({ error: 'Ya existe un usuario con ese nombre de usuario.' });
    return;
  }

  const { rows } = await pool.query(
    `insert into usuarios (id, nombre, pin, rol, activo)
     values ($1, $2, $3, $4, true)
     returning id, nombre, rol, activo`,
    [idNormalizado, nombre, pin, rol]
  );
  res.json({ usuario: rows[0] });
});

const actualizarUsuarioSchema = z.object({
  nombre: z.string().trim().min(2).optional(),
  pin: z.string().trim().length(4).optional(),
  rol: z.enum(['admin', 'operador']).optional(),
  activo: z.boolean().optional(),
});

// PATCH /admin/usuarios/:id — actualiza datos, rol, PIN o estado activo de un usuario
usuariosRouter.patch('/admin/usuarios/:id', requireAuth, requireAdmin, async (req, res) => {
  const parsed = actualizarUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }
  const { nombre, pin, rol, activo } = parsed.data;
  const id = String(req.params.id).toLowerCase();

  const { rows } = await pool.query(
    `update usuarios set
       nombre = coalesce($2, nombre),
       pin = coalesce($3, pin),
       rol = coalesce($4, rol),
       activo = coalesce($5, activo)
     where id = $1
     returning id, nombre, rol, activo`,
    [id, nombre ?? null, pin ?? null, rol ?? null, activo ?? null]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }
  res.json({ usuario: rows[0] });
});
