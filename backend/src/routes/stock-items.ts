import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRol, type AuthClaims } from "../auth.js";
import { pool } from "../db/client.js";

export const stockItemsRouter = Router();

const itemStockSchema = z.object({
  productoId: z.number().int(),
  loteId: z.number().int().optional(),
  cantidad: z.number().positive(),
});

// POST /stock-items — ingreso de un producto sin código de barras (embutidos, chorizos, morcillas, etc.)
stockItemsRouter.post(
  "/stock-items",
  requireAuth,
  requireRol("operador", "admin"),
  async (req, res) => {
    const parsed = itemStockSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
      return;
    }
    const { productoId, loteId, cantidad } = parsed.data;
    const usuario = (req as { user?: AuthClaims }).user;

    const { rows } = await pool.query(
      `insert into items_stock (producto_id, lote_id, cantidad, cantidad_disponible, registrado_por)
     values ($1, $2, $3, $3, $4)
     returning id, producto_id as "productoId", lote_id as "loteId",
               cantidad, cantidad_disponible as "cantidadDisponible"`,
      [productoId, loteId ?? null, cantidad, usuario?.nombre ?? null],
    );
    res.json({ itemStock: rows[0] });
  },
);

// GET /stock-items?loteId=1 — listado de ingresos de stock sin código de barras
stockItemsRouter.get("/stock-items", requireAuth, async (req, res) => {
  const loteId =
    typeof req.query.loteId === "string" ? Number(req.query.loteId) : undefined;

  const { rows } = await pool.query(
    `select i.id, i.producto_id as "productoId", p.nombre as "productoNombre", p.unidad,
            i.lote_id as "loteId", i.cantidad, i.cantidad_disponible as "cantidadDisponible"
     from items_stock i
     join productos p on p.id = i.producto_id
     where ($1::int is null or i.lote_id = $1)
     order by i.created_at desc`,
    [loteId ?? null],
  );
  res.json({ itemsStock: rows });
});
