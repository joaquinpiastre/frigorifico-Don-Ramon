import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthClaims } from "../auth.js";
import { pool } from "../db/client.js";

export const clientesRouter = Router();

const CONDICIONES_IVA = [
  "responsable_inscripto",
  "monotributo",
  "exento",
  "consumidor_final",
] as const;

const clienteSchema = z.object({
  numeroCliente: z.string().min(1),
  nombre: z.string().min(1),
  razonSocial: z.string().optional(),
  cuit: z.string().optional(),
  condicionIva: z.enum(CONDICIONES_IVA).optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

// GET /admin/clientes — listado con saldo calculado (ventas - pagos)
clientesRouter.get("/admin/clientes", requireAuth, async (_req, res) => {
  const { rows } = await pool.query(
    `select c.id, c.numero_cliente as "numeroCliente", c.nombre, c.razon_social as "razonSocial",
            c.cuit, c.condicion_iva as "condicionIva", c.telefono, c.direccion, c.activo,
            coalesce(v.total, 0) - coalesce(p.total, 0) as saldo
     from clientes c
     left join (select cliente_id, sum(total_importe) as total from ventas group by cliente_id) v
       on v.cliente_id = c.id
     left join (select cliente_id, sum(monto) as total from pagos group by cliente_id) p
       on p.cliente_id = c.id
     order by c.nombre`,
  );
  res.json({ clientes: rows });
});

// POST /admin/clientes — alta de cliente
clientesRouter.post("/admin/clientes", requireAuth, async (req, res) => {
  const parsed = clienteSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
    return;
  }
  const {
    numeroCliente,
    nombre,
    razonSocial,
    cuit,
    condicionIva,
    telefono,
    direccion,
  } = parsed.data;

  const existente = await pool.query(
    "select id from clientes where numero_cliente = $1",
    [numeroCliente],
  );
  if (existente.rows.length > 0) {
    res.status(409).json({ error: "Ya existe un cliente con ese número." });
    return;
  }

  const { rows } = await pool.query(
    `insert into clientes (numero_cliente, nombre, razon_social, cuit, condicion_iva, telefono, direccion)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, numero_cliente as "numeroCliente", nombre, razon_social as "razonSocial",
               cuit, condicion_iva as "condicionIva", telefono, direccion, activo`,
    [
      numeroCliente,
      nombre,
      razonSocial ?? null,
      cuit ?? null,
      condicionIva ?? null,
      telefono ?? null,
      direccion ?? null,
    ],
  );
  res.json({ cliente: rows[0] });
});

// GET /admin/clientes/:id — detalle con historial de compras y pagos
clientesRouter.get("/admin/clientes/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Id inválido." });
    return;
  }

  const clienteResult = await pool.query(
    `select id, numero_cliente as "numeroCliente", nombre, razon_social as "razonSocial",
            cuit, condicion_iva as "condicionIva", telefono, direccion, activo
     from clientes where id = $1`,
    [id],
  );
  if (clienteResult.rows.length === 0) {
    res.status(404).json({ error: "Cliente no encontrado." });
    return;
  }

  const ventas = await pool.query(
    `select id, numero_remito as "numeroRemito", fecha, total_importe as "totalImporte"
     from ventas where cliente_id = $1 order by fecha desc`,
    [id],
  );
  const pagos = await pool.query(
    `select id, venta_id as "ventaId", monto, metodo, dias_cheque as "diasCheque",
            numero_cheque as "numeroCheque", banco, fecha, registrado_por as "registradoPor"
     from pagos where cliente_id = $1 order by fecha desc`,
    [id],
  );

  const productosEntregados = await pool.query(
    `select pi.id, pi.producto_id as "productoId", pr.nombre as "productoNombre",
            pi.cantidad, pi.precio, p.id as "pedidoId", p.entregado_en as "fecha"
     from pedido_items pi
     join pedidos p on p.id = pi.pedido_id
     join productos pr on pr.id = pi.producto_id
     where p.cliente_id = $1 and p.estado = 'entregado'
     order by p.entregado_en desc
     limit 200`,
    [id],
  );

  const totalVentas = ventas.rows.reduce(
    (acc, v) => acc + Number(v.totalImporte),
    0,
  );
  const totalPagos = pagos.rows.reduce((acc, p) => acc + Number(p.monto), 0);

  res.json({
    cliente: clienteResult.rows[0],
    ventas: ventas.rows,
    pagos: pagos.rows,
    productosEntregados: productosEntregados.rows,
    saldo: totalVentas - totalPagos,
  });
});

const actualizarClienteSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  razonSocial: z.string().trim().optional(),
  cuit: z.string().trim().optional(),
  condicionIva: z.enum(CONDICIONES_IVA).optional(),
  telefono: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
});

// PATCH /admin/clientes/:id — edita datos de contacto del cliente (lo usa también el repartidor)
clientesRouter.patch("/admin/clientes/:id", requireAuth, async (req, res) => {
  const parsed = actualizarClienteSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
    return;
  }
  const { nombre, razonSocial, cuit, condicionIva, telefono, direccion } =
    parsed.data;
  const id = Number(req.params.id);

  const { rows } = await pool.query(
    `update clientes set
       nombre = coalesce($2, nombre),
       razon_social = coalesce($3, razon_social),
       cuit = coalesce($4, cuit),
       condicion_iva = coalesce($5, condicion_iva),
       telefono = coalesce($6, telefono),
       direccion = coalesce($7, direccion)
     where id = $1
     returning id, numero_cliente as "numeroCliente", nombre, razon_social as "razonSocial",
               cuit, condicion_iva as "condicionIva", telefono, direccion, activo`,
    [
      id,
      nombre ?? null,
      razonSocial ?? null,
      cuit ?? null,
      condicionIva ?? null,
      telefono ?? null,
      direccion ?? null,
    ],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Cliente no encontrado." });
    return;
  }
  res.json({ cliente: rows[0] });
});

const METODOS_PAGO = ["efectivo", "transferencia", "cheque"] as const;

const pagoSchema = z.object({
  clienteId: z.number().int(),
  ventaId: z.number().int().optional(),
  monto: z.number().positive(),
  metodo: z.enum(METODOS_PAGO).optional(),
  diasCheque: z.number().int().positive().optional(),
  numeroCheque: z.string().trim().min(1).optional(),
  banco: z.string().trim().min(1).optional(),
});

// POST /admin/pagos — registra un pago de un cliente (cuenta corriente)
clientesRouter.post("/admin/pagos", requireAuth, async (req, res) => {
  const parsed = pagoSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Datos inválidos.", detalle: parsed.error.flatten() });
    return;
  }
  const { clienteId, ventaId, monto, metodo, diasCheque, numeroCheque, banco } =
    parsed.data;
  if (metodo !== "cheque" && (diasCheque || numeroCheque || banco)) {
    res
      .status(400)
      .json({ error: 'Los datos de cheque solo aplican al método "cheque".' });
    return;
  }
  const usuario = (req as { user?: AuthClaims }).user;
  const { rows } = await pool.query(
    `insert into pagos (cliente_id, venta_id, monto, metodo, dias_cheque, numero_cheque, banco, registrado_por)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id, cliente_id as "clienteId", venta_id as "ventaId", monto, metodo,
               dias_cheque as "diasCheque", numero_cheque as "numeroCheque", banco, fecha,
               registrado_por as "registradoPor"`,
    [
      clienteId,
      ventaId ?? null,
      monto,
      metodo ?? null,
      diasCheque ?? null,
      numeroCheque ?? null,
      banco ?? null,
      usuario?.nombre ?? null,
    ],
  );
  res.json({ pago: rows[0] });
});
