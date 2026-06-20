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

// GET /admin/reses?estado=en_stock — listado de reses, filtrable por estado
resesRouter.get('/admin/reses', requireAuth, async (req, res) => {
  const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
  const { rows } = await pool.query(
    `select id, lote_id as "loteId", cor, garron, clasificacion,
            kilos_ingreso as "kilosIngreso", kilos_disponibles as "kilosDisponibles", estado
     from reses
     where ($1::text is null or estado = $1)
     order by created_at desc`,
    [estado ?? null]
  );
  res.json({ reses: rows });
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
