import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../auth.js";
import { pool } from "../db/client.js";

export const historialRouter = Router();

const mesSchema = z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/) });
const diaSchema = z.object({ fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

// GET /admin/historial/mes?mes=YYYY-MM — actividad por día del mes, para marcar el calendario
historialRouter.get(
  "/admin/historial/mes",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const parsed = mesSchema.safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: 'Parámetro "mes" inválido (usar YYYY-MM).' });
      return;
    }
    const inicio = `${parsed.data.mes}-01`;

    const [ventas, pedidos, pagos] = await Promise.all([
      pool.query<{ fecha: string; cantidad: string; total: string }>(
        `select fecha::date::text as fecha, count(*) as cantidad, coalesce(sum(total_importe), 0) as total
       from ventas
       where fecha >= $1::date and fecha < $1::date + interval '1 month'
       group by fecha::date`,
        [inicio],
      ),
      pool.query<{ fecha: string; cantidad: string }>(
        `select fecha::date::text as fecha, count(*) as cantidad
       from pedidos
       where fecha >= $1::date and fecha < $1::date + interval '1 month'
       group by fecha::date`,
        [inicio],
      ),
      pool.query<{ fecha: string; total: string }>(
        `select fecha::date::text as fecha, coalesce(sum(monto), 0) as total
       from pagos
       where fecha >= $1::date and fecha < $1::date + interval '1 month'
       group by fecha::date`,
        [inicio],
      ),
    ]);

    const porDia = new Map<
      string,
      {
        fecha: string;
        cantidadVentas: number;
        totalVentas: number;
        cantidadPedidos: number;
        totalCobros: number;
      }
    >();
    const obtener = (fecha: string) => {
      let dia = porDia.get(fecha);
      if (!dia) {
        dia = {
          fecha,
          cantidadVentas: 0,
          totalVentas: 0,
          cantidadPedidos: 0,
          totalCobros: 0,
        };
        porDia.set(fecha, dia);
      }
      return dia;
    };
    for (const r of ventas.rows) {
      const dia = obtener(r.fecha);
      dia.cantidadVentas = Number(r.cantidad);
      dia.totalVentas = Number(r.total);
    }
    for (const r of pedidos.rows) {
      obtener(r.fecha).cantidadPedidos = Number(r.cantidad);
    }
    for (const r of pagos.rows) {
      obtener(r.fecha).totalCobros = Number(r.total);
    }

    res.json({
      dias: Array.from(porDia.values()).sort((a, b) =>
        a.fecha.localeCompare(b.fecha),
      ),
    });
  },
);

// GET /admin/historial/dia?fecha=YYYY-MM-DD — detalle completo de un día puntual
historialRouter.get(
  "/admin/historial/dia",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const parsed = diaSchema.safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: 'Parámetro "fecha" inválido (usar YYYY-MM-DD).' });
      return;
    }
    const { fecha } = parsed.data;

    const [ventas, pedidos, pagos, productosVendidos, kilos] =
      await Promise.all([
        pool.query<{
          id: number;
          numeroRemito: number;
          clienteNombre: string;
          totalImporte: string;
          fecha: string;
        }>(
          `select v.id, v.numero_remito as "numeroRemito", c.nombre as "clienteNombre",
              v.total_importe as "totalImporte", v.fecha
       from ventas v
       join clientes c on c.id = v.cliente_id
       where v.fecha::date = $1::date
       order by v.fecha desc`,
          [fecha],
        ),
        pool.query<{
          id: number;
          clienteNombre: string;
          repartidorNombre: string | null;
          repartidor: string;
          estado: string;
          total: string;
          piezas: string;
        }>(
          `select p.id, c.nombre as "clienteNombre", u.nombre as "repartidorNombre", p.repartidor, p.estado,
              coalesce(sum(pi.cantidad * pi.precio), 0) as total, count(pi.id) as piezas
       from pedidos p
       join clientes c on c.id = p.cliente_id
       left join usuarios u on u.id = p.repartidor
       left join pedido_items pi on pi.pedido_id = p.id
       where p.fecha::date = $1::date
       group by p.id, c.nombre, u.nombre, p.repartidor, p.estado
       order by p.id desc`,
          [fecha],
        ),
        pool.query<{ metodo: string; cantidad: string; total: string }>(
          `select coalesce(metodo, 'Sin especificar') as metodo, count(*) as cantidad, coalesce(sum(monto), 0) as total
       from pagos
       where fecha::date = $1::date
       group by coalesce(metodo, 'Sin especificar')`,
          [fecha],
        ),
        pool.query<{
          descripcion: string;
          kilos: string;
          importe: string;
          piezas: string;
        }>(
          `select vi.descripcion, coalesce(sum(vi.kilos), 0) as kilos,
              coalesce(sum(vi.importe), 0) as importe, count(*) as piezas
       from venta_items vi
       join ventas v on v.id = vi.venta_id
       where v.fecha::date = $1::date
       group by vi.descripcion
       order by importe desc`,
          [fecha],
        ),
        pool.query<{ kilos: string }>(
          `select coalesce(sum(vi.kilos), 0) as kilos
       from venta_items vi
       join ventas v on v.id = vi.venta_id
       where v.fecha::date = $1::date`,
          [fecha],
        ),
      ]);

    const totalVentas = ventas.rows.reduce(
      (acc, v) => acc + Number(v.totalImporte),
      0,
    );
    const totalCobros = pagos.rows.reduce((acc, p) => acc + Number(p.total), 0);

    res.json({
      fecha,
      resumen: {
        cantidadVentas: ventas.rows.length,
        totalVentas,
        cantidadPedidos: pedidos.rows.length,
        cantidadPagos: pagos.rows.reduce(
          (acc, p) => acc + Number(p.cantidad),
          0,
        ),
        totalCobros,
        kilosVendidos: Number(kilos.rows[0].kilos),
      },
      ventas: ventas.rows.map((v) => ({
        id: v.id,
        numeroRemito: v.numeroRemito,
        clienteNombre: v.clienteNombre,
        totalImporte: Number(v.totalImporte),
        fecha: v.fecha,
      })),
      pedidos: pedidos.rows.map((p) => ({
        id: p.id,
        clienteNombre: p.clienteNombre,
        repartidorNombre: p.repartidorNombre ?? p.repartidor,
        estado: p.estado,
        total: Number(p.total),
        piezas: Number(p.piezas),
      })),
      pagos: pagos.rows.map((p) => ({
        metodo: p.metodo,
        cantidad: Number(p.cantidad),
        total: Number(p.total),
      })),
      productosVendidos: productosVendidos.rows.map((p) => ({
        descripcion: p.descripcion,
        kilos: Number(p.kilos),
        importe: Number(p.importe),
        piezas: Number(p.piezas),
      })),
    });
  },
);
