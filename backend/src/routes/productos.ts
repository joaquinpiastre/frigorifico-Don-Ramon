import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../auth.js';
import { pool } from '../db/client.js';

export const productosRouter = Router();

const CATEGORIAS = ['vacuno', 'cerdo', 'toro', 'embutido', 'otro'] as const;
const UNIDADES = ['kg', 'unidad'] as const;

// GET /productos?q=texto — listado/búsqueda para el autocomplete del operador y el CRUD del admin
productosRouter.get('/productos', requireAuth, async (req, res) => {
  const q = typeof req.query.q === 'string' && req.query.q.trim() ? `%${req.query.q.trim()}%` : undefined;
  const { rows } = await pool.query(
    `select id, nombre, categoria, tiene_codigo_barra as "tieneCodigoBarra", unidad, activo
     from productos
     where activo = true and ($1::text is null or nombre ilike $1)
     order by nombre`,
    [q ?? null]
  );
  res.json({ productos: rows });
});

const productoSchema = z.object({
  nombre: z.string().trim().min(1),
  categoria: z.enum(CATEGORIAS),
  tieneCodigoBarra: z.boolean().default(false),
  unidad: z.enum(UNIDADES).default('kg'),
});

// POST /productos — alta de producto en el catálogo
productosRouter.post('/productos', requireAuth, requireAdmin, async (req, res) => {
  const parsed = productoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }
  const { nombre, categoria, tieneCodigoBarra, unidad } = parsed.data;
  const { rows } = await pool.query(
    `insert into productos (nombre, categoria, tiene_codigo_barra, unidad)
     values ($1, $2, $3, $4)
     returning id, nombre, categoria, tiene_codigo_barra as "tieneCodigoBarra", unidad, activo`,
    [nombre, categoria, tieneCodigoBarra, unidad]
  );
  res.json({ producto: rows[0] });
});

const actualizarProductoSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  categoria: z.enum(CATEGORIAS).optional(),
  tieneCodigoBarra: z.boolean().optional(),
  unidad: z.enum(UNIDADES).optional(),
  activo: z.boolean().optional(),
});

// PATCH /productos/:id — editar o desactivar un producto
productosRouter.patch('/productos/:id', requireAuth, requireAdmin, async (req, res) => {
  const parsed = actualizarProductoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
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
    [id, nombre ?? null, categoria ?? null, tieneCodigoBarra ?? null, unidad ?? null, activo ?? null]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }
  res.json({ producto: rows[0] });
});
