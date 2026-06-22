import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { pool } from '../db/client.js';

export const resesRouter = Router();

const loteSchema = z.object({
  numeroTropa: z.string().min(1),
  dte: z.string().optional(),
  fechaFaena: z.string().optional(),
  establecimiento: z.string().optional(),
  kilosVivosTotal: z.number().optional(),
});

// POST /admin/lotes — cabecera de una tropa/romaneo
resesRouter.post('/admin/lotes', requireAuth, async (req, res) => {
  const parsed = loteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }
  const { numeroTropa, dte, fechaFaena, establecimiento, kilosVivosTotal } = parsed.data;
  const { rows } = await pool.query(
    `insert into lotes_ingreso (numero_tropa, dte, fecha_faena, establecimiento, kilos_vivos_total)
     values ($1, $2, $3, $4, $5)
     returning id, numero_tropa as "numeroTropa", dte, fecha_faena as "fechaFaena",
               establecimiento, kilos_vivos_total as "kilosVivosTotal"`,
    [numeroTropa, dte ?? null, fechaFaena ?? null, establecimiento ?? null, kilosVivosTotal ?? null]
  );
  res.json({ lote: rows[0] });
});

// GET /admin/lotes — listado de tropas
resesRouter.get('/admin/lotes', requireAuth, async (_req, res) => {
  const { rows } = await pool.query(
    `select id, numero_tropa as "numeroTropa", dte, fecha_faena as "fechaFaena",
            establecimiento, kilos_vivos_total as "kilosVivosTotal"
     from lotes_ingreso
     order by created_at desc`
  );
  res.json({ lotes: rows });
});

const resSchema = z.object({
  loteId: z.number().int(),
  cor: z.string().min(1),
  garron: z.string().optional(),
  clasificacion: z.string().optional(),
  kilos: z.number().positive(),
});

// POST /admin/reses — registra una res entera (alta de stock) a partir de su etiqueta con código de barras
resesRouter.post('/admin/reses', requireAuth, async (req, res) => {
  const parsed = resSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }
  const { loteId, cor, garron, clasificacion, kilos } = parsed.data;

  const existente = await pool.query('select id from reses where cor = $1', [cor]);
  if (existente.rows.length > 0) {
    res.status(409).json({ error: 'Ya existe una res con ese código (Cor).' });
    return;
  }

  const { rows } = await pool.query(
    `insert into reses (lote_id, cor, garron, clasificacion, kilos_ingreso, kilos_disponibles)
     values ($1, $2, $3, $4, $5, $5)
     returning id, lote_id as "loteId", cor, garron, clasificacion,
               kilos_ingreso as "kilosIngreso", kilos_disponibles as "kilosDisponibles", estado`,
    [loteId, cor, garron ?? null, clasificacion ?? null, kilos]
  );
  res.json({ res: rows[0] });
});

// GET /admin/reses?estado=en_stock&q=texto&loteId=1 — listado de reses, filtrable y paginado para soportar grandes volúmenes
resesRouter.get('/admin/reses', requireAuth, async (req, res) => {
  const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
  const q = typeof req.query.q === 'string' && req.query.q.trim() ? `%${req.query.q.trim()}%` : undefined;
  const loteId = typeof req.query.loteId === 'string' ? Number(req.query.loteId) : undefined;
  const limite = Math.min(Number(req.query.limit) || 100, 500);

  const { rows } = await pool.query(
    `select id, lote_id as "loteId", cor, garron, clasificacion,
            kilos_ingreso as "kilosIngreso", kilos_disponibles as "kilosDisponibles", estado
     from reses
     where ($1::text is null or estado = $1)
       and ($2::text is null or cor ilike $2 or garron ilike $2 or clasificacion ilike $2)
       and ($3::int is null or lote_id = $3)
     order by created_at desc
     limit $4`,
    [estado ?? null, q ?? null, loteId ?? null, limite]
  );
  res.json({ reses: rows });
});

const actualizarResSchema = z.object({
  garron: z.string().trim().optional(),
  clasificacion: z.string().trim().optional(),
  kilosDisponibles: z.number().nonnegative().optional(),
  estado: z.enum(['en_stock', 'agotada']).optional(),
});

// PATCH /admin/reses/:id — corrige garrón, clasificación, kilos disponibles o estado de una res ya cargada
resesRouter.patch('/admin/reses/:id', requireAuth, async (req, res) => {
  const parsed = actualizarResSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }
  const { garron, clasificacion, kilosDisponibles, estado } = parsed.data;
  const id = Number(req.params.id);

  const { rows } = await pool.query(
    `update reses set
       garron = coalesce($2, garron),
       clasificacion = coalesce($3, clasificacion),
       kilos_disponibles = coalesce($4, kilos_disponibles),
       estado = coalesce($5, estado)
     where id = $1
     returning id, lote_id as "loteId", cor, garron, clasificacion,
               kilos_ingreso as "kilosIngreso", kilos_disponibles as "kilosDisponibles", estado`,
    [id, garron ?? null, clasificacion ?? null, kilosDisponibles ?? null, estado ?? null]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: 'No existe una res con ese id.' });
    return;
  }
  res.json({ res: rows[0] });
});

// GET /admin/reses/:codigo — busca una res por el código de barras (Cor) escaneado
resesRouter.get('/admin/reses/:codigo', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `select id, lote_id as "loteId", cor, garron, clasificacion,
            kilos_ingreso as "kilosIngreso", kilos_disponibles as "kilosDisponibles", estado
     from reses
     where cor = $1`,
    [req.params.codigo]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: 'No existe una res con ese código.' });
    return;
  }
  res.json({ res: rows[0] });
});
