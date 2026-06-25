import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRol, type AuthClaims } from '../auth.js';
import { pool } from '../db/client.js';

export const stockItemsRouter = Router();

const itemStockSchema = z.object({
  productoId: z.number().int(),
  cantidad: z.number().positive(),
});

// POST /stock-items — ingreso de un producto sin código de barras (embutidos, chorizos, morcillas, etc.)
stockItemsRouter.post('/stock-items', requireAuth, requireRol('operador', 'admin'), async (req, res) => {
  const parsed = itemStockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }
  const { productoId, cantidad } = parsed.data;
  const usuario = (req as { user?: AuthClaims }).user;

  const { rows } = await pool.query(
    `insert into items_stock (producto_id, cantidad, cantidad_disponible, registrado_por)
     values ($1, $2, $2, $3)
     returning id, producto_id as "productoId", cantidad, cantidad_disponible as "cantidadDisponible"`,
    [productoId, cantidad, usuario?.nombre ?? null]
  );
  res.json({ itemStock: rows[0] });
});

// GET /stock-items — listado de ingresos de stock sin código de barras
stockItemsRouter.get('/stock-items', requireAuth, async (_req, res) => {
  const { rows } = await pool.query(
    `select i.id, i.producto_id as "productoId", p.nombre as "productoNombre",
            i.cantidad, i.cantidad_disponible as "cantidadDisponible"
     from items_stock i
     join productos p on p.id = i.producto_id
     order by i.created_at desc`
  );
  res.json({ itemsStock: rows });
});
