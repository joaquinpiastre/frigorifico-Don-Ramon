import { Router } from "express";
import { requireAdmin, requireAuth } from "../auth.js";
import { pool } from "../db/client.js";

export const estadisticasRouter = Router();

// GET /admin/estadisticas — resumen del negocio para el panel principal
estadisticasRouter.get(
  "/admin/estadisticas",
  requireAuth,
  async (_req, res) => {
    const [
      ventasHoy,
      ventasMes,
      stock,
      saldosPorCliente,
      actividad,
      entregasHoy,
      ventasHoyPorCliente,
    ] = await Promise.all([
      pool.query<{ cantidad: string; total: string }>(
        `select count(distinct p.id) as cantidad, coalesce(sum(pi.cantidad * pi.precio), 0) as total
       from pedidos p
       join pedido_items pi on pi.pedido_id = p.id
       where p.estado = 'entregado' and p.entregado_en::date = current_date`,
      ),
      pool.query<{ cantidad: string; total: string }>(
        `select count(distinct p.id) as cantidad, coalesce(sum(pi.cantidad * pi.precio), 0) as total
       from pedidos p
       join pedido_items pi on pi.pedido_id = p.id
       where p.estado = 'entregado' and date_trunc('month', p.entregado_en) = date_trunc('month', now())`,
      ),
      pool.query<{ reses: string; kilos: string }>(
        `select count(*) as reses, coalesce(sum(kilos_disponibles), 0) as kilos
       from reses where estado = 'en_stock'`,
      ),
      pool.query<{ id: number; nombre: string; saldo: string }>(
        `select c.id, c.nombre, coalesce(pe.total, 0) - coalesce(pg.total, 0) as saldo
       from clientes c
       left join (
         select ped.cliente_id, sum(pi.cantidad * pi.precio) as total
         from pedidos ped
         join pedido_items pi on pi.pedido_id = ped.id
         where ped.estado = 'entregado'
         group by ped.cliente_id
       ) pe on pe.cliente_id = c.id
       left join (select cliente_id, sum(monto) as total from pagos group by cliente_id) pg
         on pg.cliente_id = c.id`,
      ),
      pool.query<{
        tipo: "venta" | "pago";
        clienteNombre: string;
        monto: string;
        fecha: string;
      }>(
        `select 'venta' as tipo, c.nombre as "clienteNombre", sum(pi.cantidad * pi.precio) as monto, p.entregado_en as fecha
       from pedidos p
       join clientes c on c.id = p.cliente_id
       join pedido_items pi on pi.pedido_id = p.id
       where p.estado = 'entregado'
       group by p.id, c.nombre, p.entregado_en
       union all
       select 'pago' as tipo, c.nombre as "clienteNombre", pg.monto, pg.fecha
       from pagos pg join clientes c on c.id = pg.cliente_id
       order by fecha desc
       limit 8`,
      ),
      pool.query<{
        id: number;
        nombre: string;
        repartidores: string;
        piezas: string;
      }>(
        `select c.id, c.nombre,
              string_agg(distinct p.repartidor, ', ') as repartidores,
              count(pi.id) as piezas
       from pedidos p
       join clientes c on c.id = p.cliente_id
       join pedido_items pi on pi.pedido_id = p.id
       where p.estado = 'entregado' and p.entregado_en::date = current_date
       group by c.id, c.nombre
       order by piezas desc`,
      ),
      pool.query<{ id: number; nombre: string; monto: string }>(
        `select c.id, c.nombre, sum(pi.cantidad * pi.precio) as monto
       from pedidos p
       join clientes c on c.id = p.cliente_id
       join pedido_items pi on pi.pedido_id = p.id
       where p.estado = 'entregado' and p.entregado_en::date = current_date
       group by c.id, c.nombre
       order by monto desc`,
      ),
    ]);

    const deudores = saldosPorCliente.rows
      .map((r) => ({ id: r.id, nombre: r.nombre, saldo: Number(r.saldo) }))
      .filter((r) => r.saldo > 0);

    res.json({
      ventasHoy: {
        cantidad: Number(ventasHoy.rows[0].cantidad),
        total: Number(ventasHoy.rows[0].total),
      },
      ventasMes: {
        cantidad: Number(ventasMes.rows[0].cantidad),
        total: Number(ventasMes.rows[0].total),
      },
      stock: {
        reses: Number(stock.rows[0].reses),
        kilos: Number(stock.rows[0].kilos),
      },
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
      entregasHoy: entregasHoy.rows.map((r) => ({
        clienteId: r.id,
        clienteNombre: r.nombre,
        repartidores: r.repartidores,
        piezas: Number(r.piezas),
      })),
      ventasHoyPorCliente: ventasHoyPorCliente.rows.map((r) => ({
        clienteId: r.id,
        clienteNombre: r.nombre,
        monto: Number(r.monto),
      })),
    });
  },
);

// GET /admin/estadisticas/dashboard — panel analítico completo (solo admin).
estadisticasRouter.get(
  "/admin/estadisticas/dashboard",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    const [
      ventasPorDia,
      ventasPorMes,
      topClientes,
      topProductosVendidos,
      stockPorClasificacion,
      stockPorProducto,
      metodosPago,
      pedidosPorEstado,
      kpis,
      clientesNuevosPorMes,
      ventasMesAnterior,
      ventasPorDiaSemana,
    ] = await Promise.all([
      pool.query<{ fecha: string; cantidad: string; total: string }>(
        `select p.entregado_en::date::text as fecha, count(distinct p.id) as cantidad,
              coalesce(sum(pi.cantidad * pi.precio), 0) as total
       from pedidos p
       join pedido_items pi on pi.pedido_id = p.id
       where p.estado = 'entregado' and p.entregado_en >= current_date - interval '29 days'
       group by p.entregado_en::date
       order by p.entregado_en::date`,
      ),
      pool.query<{ mes: string; cantidad: string; total: string }>(
        `select to_char(date_trunc('month', p.entregado_en), 'YYYY-MM') as mes,
              count(distinct p.id) as cantidad, coalesce(sum(pi.cantidad * pi.precio), 0) as total
       from pedidos p
       join pedido_items pi on pi.pedido_id = p.id
       where p.estado = 'entregado' and p.entregado_en >= date_trunc('month', now()) - interval '11 months'
       group by date_trunc('month', p.entregado_en)
       order by date_trunc('month', p.entregado_en)`,
      ),
      pool.query<{
        id: number;
        nombre: string;
        total: string;
        cantidad: string;
      }>(
        `select c.id, c.nombre, sum(pi.cantidad * pi.precio) as total, count(distinct p.id) as cantidad
       from pedidos p
       join clientes c on c.id = p.cliente_id
       join pedido_items pi on pi.pedido_id = p.id
       where p.estado = 'entregado'
       group by c.id, c.nombre
       order by total desc
       limit 10`,
      ),
      pool.query<{
        descripcion: string;
        kilos: string;
        importe: string;
        piezas: string;
      }>(
        `select pr.nombre as descripcion, coalesce(sum(pi.cantidad), 0) as kilos,
              coalesce(sum(pi.cantidad * pi.precio), 0) as importe, count(*) as piezas
       from pedido_items pi
       join pedidos p on p.id = pi.pedido_id
       join productos pr on pr.id = pi.producto_id
       where p.estado = 'entregado'
       group by pr.nombre
       order by importe desc
       limit 10`,
      ),
      pool.query<{ clasificacion: string; cantidad: string; kilos: string }>(
        `select coalesce(clasificacion, 'Sin clasificar') as clasificacion,
              count(*) as cantidad, coalesce(sum(kilos_disponibles), 0) as kilos
       from reses
       where estado = 'en_stock'
       group by coalesce(clasificacion, 'Sin clasificar')
       order by kilos desc`,
      ),
      pool.query<{ nombre: string; categoria: string; cantidad: string }>(
        `select p.nombre, p.categoria, coalesce(sum(i.cantidad_disponible), 0) as cantidad
       from items_stock i
       join productos p on p.id = i.producto_id
       group by p.nombre, p.categoria
       order by cantidad desc
       limit 10`,
      ),
      pool.query<{ metodo: string; cantidad: string; total: string }>(
        `select coalesce(metodo, 'Sin especificar') as metodo, count(*) as cantidad, coalesce(sum(monto), 0) as total
       from pagos
       group by coalesce(metodo, 'Sin especificar')
       order by total desc`,
      ),
      pool.query<{ estado: string; cantidad: string }>(
        `select estado, count(*) as cantidad from pedidos group by estado`,
      ),
      pool.query<{
        ticketPromedio: string;
        kilosVendidosMes: string;
        clientesActivosMes: string;
        ventasTotalHistorico: string;
      }>(
        `select
         coalesce((
           select avg(t.total) from (
             select sum(pi.cantidad * pi.precio) as total
             from pedidos p join pedido_items pi on pi.pedido_id = p.id
             where p.estado = 'entregado'
             group by p.id
           ) t
         ), 0) as "ticketPromedio",
         coalesce((
           select sum(pi.cantidad) from pedido_items pi join pedidos p on p.id = pi.pedido_id
           where p.estado = 'entregado' and date_trunc('month', p.entregado_en) = date_trunc('month', now())
         ), 0) as "kilosVendidosMes",
         coalesce((
           select count(distinct p.cliente_id) from pedidos p
           where p.estado = 'entregado' and date_trunc('month', p.entregado_en) = date_trunc('month', now())
         ), 0) as "clientesActivosMes",
         coalesce((
           select sum(pi.cantidad * pi.precio) from pedido_items pi join pedidos p on p.id = pi.pedido_id
           where p.estado = 'entregado'
         ), 0) as "ventasTotalHistorico"`,
      ),
      pool.query<{ mes: string; cantidad: string }>(
        `select to_char(date_trunc('month', created_at), 'YYYY-MM') as mes, count(*) as cantidad
       from clientes
       where created_at >= date_trunc('month', now()) - interval '11 months'
       group by date_trunc('month', created_at)
       order by date_trunc('month', created_at)`,
      ),
      pool.query<{ total: string }>(
        `select coalesce(sum(pi.cantidad * pi.precio), 0) as total
       from pedido_items pi join pedidos p on p.id = pi.pedido_id
       where p.estado = 'entregado'
         and date_trunc('month', p.entregado_en) = date_trunc('month', now()) - interval '1 month'`,
      ),
      pool.query<{ diaSemana: number; cantidad: string; total: string }>(
        `select extract(isodow from p.entregado_en)::int as "diaSemana",
              count(distinct p.id) as cantidad, coalesce(sum(pi.cantidad * pi.precio), 0) as total
       from pedidos p
       join pedido_items pi on pi.pedido_id = p.id
       where p.estado = 'entregado' and p.entregado_en >= current_date - interval '89 days'
       group by extract(isodow from p.entregado_en)
       order by "diaSemana"`,
      ),
    ]);

    res.json({
      ventasPorDia: ventasPorDia.rows.map((r) => ({
        fecha: r.fecha,
        cantidad: Number(r.cantidad),
        total: Number(r.total),
      })),
      ventasPorMes: ventasPorMes.rows.map((r) => ({
        mes: r.mes,
        cantidad: Number(r.cantidad),
        total: Number(r.total),
      })),
      topClientes: topClientes.rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        total: Number(r.total),
        cantidad: Number(r.cantidad),
      })),
      topProductosVendidos: topProductosVendidos.rows.map((r) => ({
        descripcion: r.descripcion,
        kilos: Number(r.kilos),
        importe: Number(r.importe),
        piezas: Number(r.piezas),
      })),
      stockPorClasificacion: stockPorClasificacion.rows.map((r) => ({
        clasificacion: r.clasificacion,
        cantidad: Number(r.cantidad),
        kilos: Number(r.kilos),
      })),
      stockPorProducto: stockPorProducto.rows.map((r) => ({
        nombre: r.nombre,
        categoria: r.categoria,
        cantidad: Number(r.cantidad),
      })),
      metodosPago: metodosPago.rows.map((r) => ({
        metodo: r.metodo,
        cantidad: Number(r.cantidad),
        total: Number(r.total),
      })),
      pedidosPorEstado: pedidosPorEstado.rows.map((r) => ({
        estado: r.estado,
        cantidad: Number(r.cantidad),
      })),
      kpis: (() => {
        const ventasMesActualTotal = ventasPorMes.rows.at(-1)?.total
          ? Number(ventasPorMes.rows.at(-1)!.total)
          : 0;
        const ventasMesAnteriorTotal = Number(ventasMesAnterior.rows[0].total);
        const variacionMesPct =
          ventasMesAnteriorTotal > 0
            ? ((ventasMesActualTotal - ventasMesAnteriorTotal) /
                ventasMesAnteriorTotal) *
              100
            : null;
        return {
          ticketPromedio: Number(kpis.rows[0].ticketPromedio),
          kilosVendidosMes: Number(kpis.rows[0].kilosVendidosMes),
          clientesActivosMes: Number(kpis.rows[0].clientesActivosMes),
          ventasTotalHistorico: Number(kpis.rows[0].ventasTotalHistorico),
          ventasMesAnterior: ventasMesAnteriorTotal,
          variacionMesPct,
        };
      })(),
      clientesNuevosPorMes: clientesNuevosPorMes.rows.map((r) => ({
        mes: r.mes,
        cantidad: Number(r.cantidad),
      })),
      ventasPorDiaSemana: ventasPorDiaSemana.rows.map((r) => ({
        diaSemana: r.diaSemana,
        cantidad: Number(r.cantidad),
        total: Number(r.total),
      })),
    });
  },
);
