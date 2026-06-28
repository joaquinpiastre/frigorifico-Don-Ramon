import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRol } from "../auth.js";
import { pool } from "../db/client.js";

export const resesRouter = Router();

// Lote por defecto para altas rápidas del operador que no indican una tropa concreta.
async function obtenerLoteDefaultId(): Promise<number> {
  const existente = await pool.query(
    "select id from lotes_ingreso where numero_tropa = 'SIN-TROPA' limit 1",
  );
  if (existente.rows.length > 0) return existente.rows[0].id;
  const creado = await pool.query(
    "insert into lotes_ingreso (numero_tropa) values ('SIN-TROPA') returning id",
  );
  return creado.rows[0].id;
}

const loteSchema = z.object({
  numeroTropa: z.string().min(1),
  dte: z.string().optional(),
  fechaFaena: z.string().optional(),
  establecimiento: z.string().optional(),
  kilosVivosTotal: z.number().optional(),
});

// POST /admin/lotes — cabecera de una tropa/romaneo
resesRouter.post("/admin/lotes", requireAuth, async (req, res) => {
  const parsed = loteSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
    return;
  }
  const { numeroTropa, dte, fechaFaena, establecimiento, kilosVivosTotal } =
    parsed.data;
  const { rows } = await pool.query(
    `insert into lotes_ingreso (numero_tropa, dte, fecha_faena, establecimiento, kilos_vivos_total)
     values ($1, $2, $3, $4, $5)
     returning id, numero_tropa as "numeroTropa", dte, fecha_faena as "fechaFaena",
               establecimiento, kilos_vivos_total as "kilosVivosTotal"`,
    [
      numeroTropa,
      dte ?? null,
      fechaFaena ?? null,
      establecimiento ?? null,
      kilosVivosTotal ?? null,
    ],
  );
  res.json({ lote: rows[0] });
});

// GET /admin/lotes — listado de tropas
resesRouter.get("/admin/lotes", requireAuth, async (_req, res) => {
  const { rows } = await pool.query(
    `select id, numero_tropa as "numeroTropa", dte, fecha_faena as "fechaFaena",
            establecimiento, kilos_vivos_total as "kilosVivosTotal"
     from lotes_ingreso
     order by created_at desc`,
  );
  res.json({ lotes: rows });
});

const actualizarLoteSchema = z.object({
  numeroTropa: z.string().trim().min(1).optional(),
  dte: z.string().trim().optional(),
  fechaFaena: z.string().optional(),
  establecimiento: z.string().trim().optional(),
});

// PATCH /admin/lotes/:id — corrige datos de una tropa ya cargada (ej. la fecha)
resesRouter.patch(
  "/admin/lotes/:id",
  requireAuth,
  requireRol("operador", "admin"),
  async (req, res) => {
    const parsed = actualizarLoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
      return;
    }
    const { numeroTropa, dte, fechaFaena, establecimiento } = parsed.data;
    const id = Number(req.params.id);

    const { rows } = await pool.query(
      `update lotes_ingreso set
       numero_tropa = coalesce($2, numero_tropa),
       dte = coalesce($3, dte),
       fecha_faena = coalesce($4, fecha_faena),
       establecimiento = coalesce($5, establecimiento)
     where id = $1
     returning id, numero_tropa as "numeroTropa", dte, fecha_faena as "fechaFaena",
               establecimiento, kilos_vivos_total as "kilosVivosTotal"`,
      [
        id,
        numeroTropa ?? null,
        dte ?? null,
        fechaFaena ?? null,
        establecimiento ?? null,
      ],
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "No existe una tropa con ese id." });
      return;
    }
    res.json({ lote: rows[0] });
  },
);

const TIPOS_RES = ["vacuno", "cerdo", "toro", "otro"] as const;

const resSchema = z.object({
  loteId: z.number().int().optional(),
  cor: z.string().min(1),
  garron: z.string().optional(),
  tipo: z.enum(TIPOS_RES).optional(),
  clasificacion: z.string().optional(),
  kilos: z.number().positive(),
});

// POST /admin/reses — registra una res entera (alta de stock) a partir de su etiqueta con código de barras
resesRouter.post(
  "/admin/reses",
  requireAuth,
  requireRol("operador", "admin"),
  async (req, res) => {
    const parsed = resSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
      return;
    }
    const { loteId, cor, garron, tipo, clasificacion, kilos } = parsed.data;

    const existente = await pool.query("select id from reses where cor = $1", [
      cor,
    ]);
    if (existente.rows.length > 0) {
      res
        .status(409)
        .json({ error: "Ya existe una res con ese código (Cor)." });
      return;
    }

    const loteIdFinal = loteId ?? (await obtenerLoteDefaultId());
    const { rows } = await pool.query(
      `insert into reses (lote_id, cor, garron, tipo, clasificacion, kilos_ingreso, kilos_disponibles)
     values ($1, $2, $3, $4, $5, $6, $6)
     returning id, lote_id as "loteId", cor, garron, tipo, clasificacion,
               kilos_ingreso as "kilosIngreso", kilos_disponibles as "kilosDisponibles", estado`,
      [
        loteIdFinal,
        cor,
        garron ?? null,
        tipo ?? "vacuno",
        clasificacion ?? null,
        kilos,
      ],
    );
    res.json({ res: rows[0] });
  },
);

// GET /admin/reses?estado=en_stock&q=texto&loteId=1 — listado de reses, filtrable y paginado para soportar grandes volúmenes
resesRouter.get("/admin/reses", requireAuth, async (req, res) => {
  const estado =
    typeof req.query.estado === "string" ? req.query.estado : undefined;
  const q =
    typeof req.query.q === "string" && req.query.q.trim()
      ? `%${req.query.q.trim()}%`
      : undefined;
  const loteId =
    typeof req.query.loteId === "string" ? Number(req.query.loteId) : undefined;
  const limite = Math.min(Number(req.query.limit) || 100, 500);

  const { rows } = await pool.query(
    `select id, lote_id as "loteId", cor, garron, tipo, clasificacion,
            kilos_ingreso as "kilosIngreso", kilos_disponibles as "kilosDisponibles", estado
     from reses
     where ($1::text is null or estado = $1)
       and ($2::text is null or cor ilike $2 or garron ilike $2 or clasificacion ilike $2 or tipo ilike $2)
       and ($3::int is null or lote_id = $3)
     order by created_at desc
     limit $4`,
    [estado ?? null, q ?? null, loteId ?? null, limite],
  );
  res.json({ reses: rows });
});

const actualizarResSchema = z.object({
  garron: z.string().trim().optional(),
  tipo: z.enum(TIPOS_RES).optional(),
  clasificacion: z.string().trim().optional(),
  kilosDisponibles: z.number().nonnegative().optional(),
  estado: z.enum(["en_stock", "agotada"]).optional(),
});

// PATCH /admin/reses/:id — corrige garrón, clasificación, kilos disponibles o estado de una res ya cargada
resesRouter.patch(
  "/admin/reses/:id",
  requireAuth,
  requireRol("operador", "admin"),
  async (req, res) => {
    const parsed = actualizarResSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
      return;
    }
    const { garron, tipo, clasificacion, kilosDisponibles, estado } =
      parsed.data;
    const id = Number(req.params.id);

    const { rows } = await pool.query(
      `update reses set
       garron = coalesce($2, garron),
       tipo = coalesce($3, tipo),
       clasificacion = coalesce($4, clasificacion),
       kilos_disponibles = coalesce($5, kilos_disponibles),
       estado = coalesce($6, estado)
     where id = $1
     returning id, lote_id as "loteId", cor, garron, tipo, clasificacion,
               kilos_ingreso as "kilosIngreso", kilos_disponibles as "kilosDisponibles", estado`,
      [
        id,
        garron ?? null,
        tipo ?? null,
        clasificacion ?? null,
        kilosDisponibles ?? null,
        estado ?? null,
      ],
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "No existe una res con ese id." });
      return;
    }
    res.json({ res: rows[0] });
  },
);

// GET /admin/reses/:codigo — busca una res por el código de barras (Cor) escaneado
resesRouter.get("/admin/reses/:codigo", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `select id, lote_id as "loteId", cor, garron, tipo, clasificacion,
            kilos_ingreso as "kilosIngreso", kilos_disponibles as "kilosDisponibles", estado
     from reses
     where cor = $1`,
    [req.params.codigo],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "No existe una res con ese código." });
    return;
  }
  res.json({ res: rows[0] });
});

// DELETE /admin/reses/:id — elimina una res del stock (ej. alta por error, etiqueta duplicada)
resesRouter.delete(
  "/admin/reses/:id",
  requireAuth,
  requireRol("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Id inválido." });
      return;
    }
    try {
      const { rows } = await pool.query(
        "delete from reses where id = $1 returning id",
        [id],
      );
      if (rows.length === 0) {
        res.status(404).json({ error: "No existe una res con ese id." });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "23503") {
        res.status(409).json({
          error:
            "No se puede eliminar: esta res ya tiene ventas o pedidos asociados.",
        });
        return;
      }
      throw err;
    }
  },
);
