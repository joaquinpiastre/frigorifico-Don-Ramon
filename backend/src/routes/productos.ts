import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../auth.js";
import { pool } from "../db/client.js";

export const productosRouter = Router();

const CATEGORIAS = ["vacuno", "cerdo", "toro", "embutido", "otro"] as const;
const UNIDADES = ["kg", "unidad"] as const;

// GET /productos?q=texto&incluirInactivos=true&excluirPedidoId=1 — listado/búsqueda para el autocomplete
// del operador y el CRUD del admin (que necesita ver también los desactivados para poder reactivarlos o
// editarlos). Para productos sin código de barras incluye "stockDisponible" (suma de items_stock) y
// "reservado" (lo que otros pedidos aún pendientes ya tienen anotado), para no ofrecer como libre algo
// que ya está comprometido en otro pedido.
productosRouter.get("/productos", requireAuth, async (req, res) => {
  const q =
    typeof req.query.q === "string" && req.query.q.trim()
      ? `%${req.query.q.trim()}%`
      : undefined;
  const incluirInactivos = req.query.incluirInactivos === "true";
  const excluirPedidoId =
    typeof req.query.excluirPedidoId === "string"
      ? Number(req.query.excluirPedidoId)
      : undefined;
  const { rows } = await pool.query(
    `select p.id, p.nombre, p.categoria, p.tiene_codigo_barra as "tieneCodigoBarra", p.unidad, p.activo,
            coalesce(stock.disponible, 0) as "stockDisponible",
            coalesce(reservas.cantidad, 0) as "reservado"
     from productos p
     left join (
       select producto_id, sum(cantidad_disponible) as disponible
       from items_stock
       group by producto_id
     ) stock on stock.producto_id = p.id
     left join (
       select pi.producto_id, sum(pi.cantidad) as cantidad
       from pedido_items pi
       join pedidos ped on ped.id = pi.pedido_id
       where ped.estado = 'pendiente' and pi.res_id is null
         and ($3::int is null or ped.id <> $3)
       group by pi.producto_id
     ) reservas on reservas.producto_id = p.id
     where ($1::boolean or p.activo = true) and ($2::text is null or p.nombre ilike $2)
     order by p.nombre`,
    [incluirInactivos, q ?? null, excluirPedidoId ?? null],
  );
  res.json({ productos: rows });
});

const productoSchema = z.object({
  nombre: z.string().trim().min(1),
  categoria: z.enum(CATEGORIAS),
  tieneCodigoBarra: z.boolean().default(false),
  unidad: z.enum(UNIDADES).default("kg"),
});

// POST /productos — alta de producto en el catálogo
productosRouter.post(
  "/productos",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const parsed = productoSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
      return;
    }
    const { nombre, categoria, tieneCodigoBarra, unidad } = parsed.data;
    const { rows } = await pool.query(
      `insert into productos (nombre, categoria, tiene_codigo_barra, unidad)
     values ($1, $2, $3, $4)
     returning id, nombre, categoria, tiene_codigo_barra as "tieneCodigoBarra", unidad, activo`,
      [nombre, categoria, tieneCodigoBarra, unidad],
    );
    res.json({ producto: rows[0] });
  },
);

const actualizarProductoSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  categoria: z.enum(CATEGORIAS).optional(),
  tieneCodigoBarra: z.boolean().optional(),
  unidad: z.enum(UNIDADES).optional(),
  activo: z.boolean().optional(),
});

// PATCH /productos/:id — editar o desactivar un producto
productosRouter.patch(
  "/productos/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const parsed = actualizarProductoSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
      return;
    }
    const { nombre, categoria, tieneCodigoBarra, unidad, activo } = parsed.data;
    const id = Number(req.params.id);

    const { rows } = await pool.query(
      `update productos set
       nombre = coalesce($2, nombre),
       categoria = coalesce($3, categoria),
       tiene_codigo_barra = coalesce($4, tiene_codigo_barra),
       unidad = coalesce($5, unidad),
       activo = coalesce($6, activo)
     where id = $1
     returning id, nombre, categoria, tiene_codigo_barra as "tieneCodigoBarra", unidad, activo`,
      [
        id,
        nombre ?? null,
        categoria ?? null,
        tieneCodigoBarra ?? null,
        unidad ?? null,
        activo ?? null,
      ],
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Producto no encontrado." });
      return;
    }
    res.json({ producto: rows[0] });
  },
);

// DELETE /productos/:id — borra un producto del catálogo (solo si nunca se usó en stock/pedidos)
productosRouter.delete(
  "/productos/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Id inválido." });
      return;
    }
    try {
      const { rows } = await pool.query(
        "delete from productos where id = $1 returning id",
        [id],
      );
      if (rows.length === 0) {
        res.status(404).json({ error: "Producto no encontrado." });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "23503") {
        res.status(409).json({
          error:
            "No se puede eliminar: este producto ya tiene stock o pedidos asociados. Desactivalo en su lugar.",
        });
        return;
      }
      throw err;
    }
  },
);
