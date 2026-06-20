import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthClaims } from '../auth.js';
import { pool } from '../db/client.js';

export const cargasRouter = Router();

// POST /admin/cargas — abre una carga de reparto nueva
cargasRouter.post('/admin/cargas', requireAuth, async (req, res) => {
  const usuario = (req as { user?: AuthClaims }).user;
  const { rows } = await pool.query(
    `insert into cargas_reparto (repartidor)
     values ($1)
     returning id, repartidor, fecha, cerrada`,
    [usuario?.nombre ?? 'Repartidor']
  );
  res.json({ carga: rows[0] });
});

// GET /admin/cargas — listado/historial de cargas
cargasRouter.get('/admin/cargas', requireAuth, async (_req, res) => {
  const { rows } = await pool.query(
    `select id, repartidor, fecha, cerrada from cargas_reparto order by fecha desc`
  );
  res.json({ cargas: rows });
});

// GET /admin/cargas/:id — detalle con los items escaneados
cargasRouter.get('/admin/cargas/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Id inválido.' });
    return;
  }

  const cargaResult = await pool.query(
    `select id, repartidor, fecha, cerrada from cargas_reparto where id = $1`,
    [id]
  );
  if (cargaResult.rows.length === 0) {
    res.status(404).json({ error: 'Carga no encontrada.' });
    return;
  }

  const items = await pool.query(
    `select ci.id, ci.escaneado_en as "escaneadoEn",
            r.id as "resId", r.cor, r.garron, r.clasificacion, r.kilos_disponibles as "kilosDisponibles"
     from carga_items ci
     join reses r on r.id = ci.res_id
     where ci.carga_id = $1
     order by ci.escaneado_en`,
    [id]
  );

  res.json({ carga: cargaResult.rows[0], items: items.rows });
});

const itemSchema = z.object({ cor: z.string().min(1) });

// POST /admin/cargas/:id/items — escanea una res por su código (Cor) y la agrega al manifiesto
cargasRouter.post('/admin/cargas/:id/items', requireAuth, async (req, res) => {
  const cargaId = Number(req.params.id);
  if (!Number.isInteger(cargaId)) {
    res.status(400).json({ error: 'Id inválido.' });
    return;
  }
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }

  const cargaResult = await pool.query('select cerrada from cargas_reparto where id = $1', [cargaId]);
  if (cargaResult.rows.length === 0) {
    res.status(404).json({ error: 'Carga no encontrada.' });
    return;
  }
  if (cargaResult.rows[0].cerrada) {
    res.status(400).json({ error: 'Esta carga ya está cerrada.' });
    return;
  }

  const resResult = await pool.query(
    `select id, cor, garron, clasificacion, kilos_disponibles as "kilosDisponibles" from reses where cor = $1`,
    [parsed.data.cor]
  );
  if (resResult.rows.length === 0) {
    res.status(404).json({ error: 'No existe una res con ese código.' });
    return;
  }
  const resEscaneada = resResult.rows[0];

  const { rows } = await pool.query(
    `insert into carga_items (carga_id, res_id)
     values ($1, $2)
     returning id, escaneado_en as "escaneadoEn"`,
    [cargaId, resEscaneada.id]
  );

  res.json({ item: { ...rows[0], res: resEscaneada } });
});

const actualizarCargaSchema = z.object({ cerrada: z.boolean() });

// PATCH /admin/cargas/:id — cierra (o reabre) la carga
cargasRouter.patch('/admin/cargas/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Id inválido.' });
    return;
  }
  const parsed = actualizarCargaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }

  const { rows } = await pool.query(
    `update cargas_reparto set cerrada = $2 where id = $1
     returning id, repartidor, fecha, cerrada`,
    [id, parsed.data.cerrada]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: 'Carga no encontrada.' });
    return;
  }
  res.json({ carga: rows[0] });
});
