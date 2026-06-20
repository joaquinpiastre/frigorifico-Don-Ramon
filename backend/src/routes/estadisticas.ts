import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { pool } from '../db/client.js';

export const estadisticasRouter = Router();

// GET /admin/estadisticas — resumen del negocio para el panel principal
estadisticasRouter.get('/admin/estadisticas', requireAuth, async (_req, res) => {
  const [ventasHoy, ventasMes, stock, saldosPorCliente, actividad] = await Promise.all([
    pool.query<{ cantidad: string; total: string }>(
      `select count(*) as cantidad, coalesce(sum(total_importe), 0) as total
       from ventas where fecha::date = current_date`
    ),
    pool.query<{ cantidad: string; total: string }>(
      `select count(*) as cantidad, coalesce(sum(total_importe), 0) as total
       from ventas where date_trunc('month', fecha) = date_trunc('month', now())`
    ),
    pool.query<{ reses: string; kilos: string }>(
      `select count(*) as reses, coalesce(sum(kilos_disponibles), 0) as kilos
       from reses where estado = 'en_stock'`
    ),
    pool.query<{ id: number; nombre: string; saldo: string }>(
      `select c.id, c.nombre, coalesce(v.total, 0) - coalesce(p.total, 0) as saldo
       from clientes c
       left join (select cliente_id, sum(total_importe) as total from ventas group by cliente_id) v
         on v.cliente_id = c.id
       left join (select cliente_id, sum(monto) as total from pagos group by cliente_id) p
         on p.cliente_id = c.id`
    ),
    pool.query<{ tipo: 'venta' | 'pago'; clienteNombre: string; monto: string; fecha: string }>(
      `select 'venta' as tipo, c.nombre as "clienteNombre", v.total_importe as monto, v.fecha
       from ventas v join clientes c on c.id = v.cliente_id
       union all
       select 'pago' as tipo, c.nombre as "clienteNombre", p.monto, p.fecha
       from pagos p join clientes c on c.id = p.cliente_id
       order by fecha desc
       limit 8`
    ),
  ]);

  const deudores = saldosPorCliente.rows
    .map((r) => ({ id: r.id, nombre: r.nombre, saldo: Number(r.saldo) }))
    .filter((r) => r.saldo > 0);

  res.json({
    ventasHoy: { cantidad: Number(ventasHoy.rows[0].cantidad), total: Number(ventasHoy.rows[0].total) },
    ventasMes: { cantidad: Number(ventasMes.rows[0].cantidad), total: Number(ventasMes.rows[0].total) },
    stock: { reses: Number(stock.rows[0].reses), kilos: Number(stock.rows[0].kilos) },
    porCobrar: {
      total: deudores.reduce((acc, d) => acc + d.saldo, 0),
      clientes: deudores.length,
    },
    topDeudores: deudores.sort((a, b) => b.saldo - a.saldo).slice(0, 5),
    actividadReciente: actividad.rows.map((r) => ({
      tipo: r.tipo,
      clienteNombre: r.clienteNombre,
      monto: Number(r.monto),
      fecha: r.fecha,
    })),
  });
});
