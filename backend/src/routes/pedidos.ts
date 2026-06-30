import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRol, type AuthClaims } from "../auth.js";
import { pool } from "../db/client.js";
import type { PoolClient } from "pg";

export const pedidosRouter = Router();

const ESTADOS = ["pendiente", "armado", "cargado", "entregado"] as const;

const itemSchema = z.object({
  productoId: z.number().int(),
  cantidad: z.number().positive(),
  precio: z.number().nonnegative(),
  garron: z.string().trim().optional(),
  tropa: z.string().trim().optional(),
  nota: z.string().trim().optional(),
  resId: z.number().int().optional(),
});

const pedidoSchema = z.object({
  clienteId: z.number().int(),
  repartidor: z.string().trim().min(1),
  items: z.array(itemSchema).min(1),
});

// POST /pedidos — el admin crea el pedido completo y lo asigna a un repartidor
pedidosRouter.post(
  "/pedidos",
  requireAuth,
  requireRol("admin"),
  async (req, res) => {
    const parsed = pedidoSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
      return;
    }
    const { clienteId, repartidor, items } = parsed.data;
    const usuario = (req as { user?: AuthClaims }).user;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const pedidoResult = await client.query(
        `insert into pedidos (cliente_id, repartidor, created_by)
       values ($1, $2, $3)
       returning id`,
        [clienteId, repartidor, usuario?.nombre ?? null],
      );
      const pedidoId = pedidoResult.rows[0].id;

      for (const item of items) {
        await client.query(
          `insert into pedido_items (pedido_id, producto_id, res_id, cantidad, precio, garron, tropa, nota)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            pedidoId,
            item.productoId,
            item.resId ?? null,
            item.cantidad,
            item.precio,
            item.garron ?? null,
            item.tropa ?? null,
            item.nota ?? null,
          ],
        );
      }

      await client.query("COMMIT");
      res.json({ pedidoId });
    } catch (err) {
      await client.query("ROLLBACK");
      const message =
        err instanceof Error ? err.message : "Error al crear el pedido.";
      res.status(500).json({ error: message });
    } finally {
      client.release();
    }
  },
);

// GET /pedidos?estado=&repartidor= — listado filtrable
pedidosRouter.get("/pedidos", requireAuth, async (req, res) => {
  const estado =
    typeof req.query.estado === "string" ? req.query.estado : undefined;
  const repartidor =
    typeof req.query.repartidor === "string" ? req.query.repartidor : undefined;

  const { rows } = await pool.query(
    `select p.id, p.cliente_id as "clienteId", c.nombre as "clienteNombre",
            p.repartidor, u.nombre as "repartidorNombre", p.estado, p.fecha
     from pedidos p
     join clientes c on c.id = p.cliente_id
     left join usuarios u on u.id = p.repartidor
     where ($1::text is null or p.estado = $1)
       and ($2::text is null or p.repartidor = $2)
     order by p.fecha desc`,
    [estado ?? null, repartidor ?? null],
  );
  res.json({ pedidos: rows });
});

// GET /pedidos/:id — detalle con líneas
pedidosRouter.get("/pedidos/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Id inválido." });
    return;
  }

  const pedidoResult = await pool.query(
    `select p.id, p.numero_remito as "numeroRemito", p.cliente_id as "clienteId", c.nombre as "clienteNombre",
            c.numero_cliente as "clienteNumero", c.telefono as "clienteTelefono", c.direccion as "clienteDireccion",
            c.razon_social as "clienteRazonSocial", c.cuit as "clienteCuit", c.condicion_iva as "clienteCondicionIva",
            p.repartidor, u.nombre as "repartidorNombre", p.estado, p.fecha
     from pedidos p
     join clientes c on c.id = p.cliente_id
     left join usuarios u on u.id = p.repartidor
     where p.id = $1`,
    [id],
  );
  if (pedidoResult.rows.length === 0) {
    res.status(404).json({ error: "Pedido no encontrado." });
    return;
  }

  const items = await pool.query(
    `select pi.id, pi.producto_id as "productoId", pr.nombre as "productoNombre",
            pi.res_id as "resId", r.cor, pi.cantidad, pi.precio, pi.garron, pi.tropa, pi.nota, pi.entregado
     from pedido_items pi
     join productos pr on pr.id = pi.producto_id
     left join reses r on r.id = pi.res_id
     where pi.pedido_id = $1`,
    [id],
  );

  res.json({ pedido: pedidoResult.rows[0], items: items.rows });
});

async function descontarStockItem(
  client: PoolClient,
  item: { productoId: number; resId: number | null; cantidad: number },
): Promise<void> {
  if (item.resId) {
    const { rows } = await client.query(
      'select kilos_disponibles as "kilosDisponibles" from reses where id = $1 for update',
      [item.resId],
    );
    if (rows.length === 0) {
      throw Object.assign(new Error(`La res ${item.resId} no existe.`), {
        status: 400,
      });
    }
    const disponibles = Number(rows[0].kilosDisponibles);
    if (item.cantidad > disponibles) {
      throw Object.assign(
        new Error(
          `La res ${item.resId} solo tiene ${disponibles} kg disponibles.`,
        ),
        { status: 400 },
      );
    }
    await client.query(
      `update reses
       set kilos_disponibles = kilos_disponibles - $1,
           estado = case when kilos_disponibles - $1 <= 0 then 'agotada' else estado end
       where id = $2`,
      [item.cantidad, item.resId],
    );
    return;
  }

  const { rows: productoRows } = await client.query(
    'select tiene_codigo_barra as "tieneCodigoBarra" from productos where id = $1',
    [item.productoId],
  );
  if (productoRows.length === 0) {
    throw Object.assign(
      new Error(`El producto ${item.productoId} no existe.`),
      {
        status: 400,
      },
    );
  }
  if (productoRows[0].tieneCodigoBarra) {
    // Carne agregada al pedido sin vincularla a una res concreta del stock
    // (se avisó al admin al crear el pedido): no hay nada que descontar.
    return;
  }

  let restante = item.cantidad;
  const { rows: lotesStock } = await client.query(
    `select id, cantidad_disponible as "cantidadDisponible"
     from items_stock
     where producto_id = $1 and cantidad_disponible > 0
     order by created_at
     for update`,
    [item.productoId],
  );
  const disponibleTotal = lotesStock.reduce(
    (acc, r) => acc + Number(r.cantidadDisponible),
    0,
  );
  if (disponibleTotal < restante) {
    throw Object.assign(
      new Error(
        `No hay suficiente stock del producto ${item.productoId} (disponible: ${disponibleTotal}).`,
      ),
      { status: 400 },
    );
  }
  for (const lote of lotesStock) {
    if (restante <= 0) break;
    const disponible = Number(lote.cantidadDisponible);
    const aDescontar = Math.min(disponible, restante);
    await client.query(
      "update items_stock set cantidad_disponible = cantidad_disponible - $1 where id = $2",
      [aDescontar, lote.id],
    );
    restante -= aDescontar;
  }
}

async function cambiarEstadoPedido(
  pedidoId: number,
  estadoActualEsperado: (typeof ESTADOS)[number],
  estadoNuevo: (typeof ESTADOS)[number],
  columnaFecha: "armado_en" | "cargado_en" | "entregado_en",
  descontarStock: boolean,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "select estado from pedidos where id = $1 for update",
      [pedidoId],
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { status: 404, body: { error: "Pedido no encontrado." } };
    }
    if (rows[0].estado !== estadoActualEsperado) {
      await client.query("ROLLBACK");
      return {
        status: 409,
        body: {
          error: `El pedido debe estar en estado "${estadoActualEsperado}" (actual: "${rows[0].estado}").`,
        },
      };
    }

    if (descontarStock) {
      const { rows: items } = await client.query(
        `select producto_id as "productoId", res_id as "resId", cantidad
         from pedido_items where pedido_id = $1`,
        [pedidoId],
      );
      for (const item of items) {
        await descontarStockItem(client, {
          productoId: item.productoId,
          resId: item.resId,
          cantidad: Number(item.cantidad),
        });
      }
    }

    if (estadoNuevo === "entregado") {
      await client.query(
        "update pedido_items set entregado = true, entregado_en = now() where pedido_id = $1",
        [pedidoId],
      );
    }

    await client.query(
      `update pedidos set estado = $2, ${columnaFecha} = now() where id = $1`,
      [pedidoId, estadoNuevo],
    );

    await client.query("COMMIT");
    return { status: 200, body: { ok: true } };
  } catch (err) {
    await client.query("ROLLBACK");
    const status = (err as { status?: number }).status ?? 500;
    const message =
      err instanceof Error ? err.message : "Error al actualizar el pedido.";
    return { status, body: { error: message } };
  } finally {
    client.release();
  }
}

// PATCH /pedidos/:id/armar — el operador separó físicamente la mercadería; descuenta stock
pedidosRouter.patch(
  "/pedidos/:id/armar",
  requireAuth,
  requireRol("operador", "admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { status, body } = await cambiarEstadoPedido(
      id,
      "pendiente",
      "armado",
      "armado_en",
      true,
    );
    res.status(status).json(body);
  },
);

// PATCH /pedidos/:id/cargar — operador o repartidor confirman que subió a la camioneta
pedidosRouter.patch(
  "/pedidos/:id/cargar",
  requireAuth,
  requireRol("operador", "repartidor", "admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { status, body } = await cambiarEstadoPedido(
      id,
      "armado",
      "cargado",
      "cargado_en",
      false,
    );
    res.status(status).json(body);
  },
);

// PATCH /pedidos/:id/entregar — el repartidor marca el pedido como entregado al cliente
pedidosRouter.patch(
  "/pedidos/:id/entregar",
  requireAuth,
  requireRol("repartidor", "admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { status, body } = await cambiarEstadoPedido(
      id,
      "cargado",
      "entregado",
      "entregado_en",
      false,
    );
    res.status(status).json(body);
  },
);
