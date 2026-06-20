import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthClaims } from '../auth.js';
import { pool } from '../db/client.js';

export const ventasRouter = Router();

const itemSchema = z.object({
  resId: z.number().int(),
  descripcion: z.string().min(1),
  kilos: z.number().positive(),
  precioKg: z.number().positive(),
});

const ventaSchema = z.object({
  clienteId: z.number().int(),
  items: z.array(itemSchema).min(1),
});

// POST /admin/ventas — registra una venta con N items, descontando stock de cada res en una transacción
ventasRouter.post('/admin/ventas', requireAuth, async (req, res) => {
  const parsed = ventaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }
  const { clienteId, items } = parsed.data;
  const usuario = (req as { user?: AuthClaims }).user;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let totalImporte = 0;
    for (const item of items) {
      const { rows } = await client.query(
        'select kilos_disponibles as "kilosDisponibles" from reses where id = $1 for update',
        [item.resId]
      );
      if (rows.length === 0) {
        throw Object.assign(new Error(`La res ${item.resId} no existe.`), { status: 400 });
      }
      const disponibles = Number(rows[0].kilosDisponibles);
      if (item.kilos > disponibles) {
        throw Object.assign(
          new Error(`La res ${item.resId} solo tiene ${disponibles} kg disponibles.`),
          { status: 400 }
        );
      }
      totalImporte += item.kilos * item.precioKg;
    }

    const ventaResult = await client.query(
      `insert into ventas (cliente_id, total_importe, created_by)
       values ($1, $2, $3)
       returning id, numero_remito as "numeroRemito", fecha, total_importe as "totalImporte"`,
      [clienteId, totalImporte, usuario?.nombre ?? null]
    );
    const venta = ventaResult.rows[0];

    for (const item of items) {
      const importe = item.kilos * item.precioKg;
      await client.query(
        `insert into venta_items (venta_id, res_id, descripcion, kilos, precio_kg, importe)
         values ($1, $2, $3, $4, $5, $6)`,
        [venta.id, item.resId, item.descripcion, item.kilos, item.precioKg, importe]
      );
      await client.query(
        `update reses
         set kilos_disponibles = kilos_disponibles - $1,
             estado = case when kilos_disponibles - $1 <= 0 then 'agotada' else estado end
         where id = $2`,
        [item.kilos, item.resId]
      );
    }

    await client.query('COMMIT');
    res.json({ venta });
  } catch (err) {
    await client.query('ROLLBACK');
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'Error al registrar la venta.';
    res.status(status).json({ error: message });
  } finally {
    client.release();
  }
});

// GET /admin/ventas/:id — detalle completo de una venta, para armar el remito
ventasRouter.get('/admin/ventas/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Id inválido.' });
    return;
  }

  const ventaResult = await pool.query(
    `select v.id, v.numero_remito as "numeroRemito", v.fecha, v.total_importe as "totalImporte",
            c.id as "clienteId", c.numero_cliente as "clienteNumero", c.nombre as "clienteNombre",
            c.telefono as "clienteTelefono", c.direccion as "clienteDireccion"
     from ventas v
     join clientes c on c.id = v.cliente_id
     where v.id = $1`,
    [id]
  );
  if (ventaResult.rows.length === 0) {
    res.status(404).json({ error: 'Venta no encontrada.' });
    return;
  }

  const items = await pool.query(
    `select vi.id, vi.descripcion, vi.kilos, vi.precio_kg as "precioKg", vi.importe,
            r.codigo_caravana as "codigoCaravana", r.gar
     from venta_items vi
     join reses r on r.id = vi.res_id
     where vi.venta_id = $1`,
    [id]
  );

  const saldoResult = await pool.query(
    `select
       (select coalesce(sum(total_importe), 0) from ventas where cliente_id = $1) -
       (select coalesce(sum(monto), 0) from pagos where cliente_id = $1) as saldo`,
    [ventaResult.rows[0].clienteId]
  );

  res.json({
    venta: ventaResult.rows[0],
    items: items.rows,
    saldoCliente: Number(saldoResult.rows[0].saldo),
  });
});
