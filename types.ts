export type RolUsuario = "admin" | "operador" | "repartidor";

export interface Usuario {
  id: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface LoteIngreso {
  id: number;
  numeroTropa: string;
  dte: string | null;
  fechaFaena: string | null;
  establecimiento: string | null;
  kilosVivosTotal: number | null;
}

export type EstadoRes = "en_stock" | "agotada";

export type TipoRes = "vacuno" | "cerdo" | "toro" | "otro";

export const TIPO_RES_LABEL: Record<TipoRes, string> = {
  vacuno: "Carne vacuna",
  cerdo: "Cerdo",
  toro: "Toro",
  otro: "Otro",
};

export interface Res {
  id: number;
  loteId: number;
  cor: string;
  garron: string | null;
  tipo: TipoRes;
  clasificacion: string | null;
  kilosIngreso: number;
  kilosDisponibles: number;
  estado: EstadoRes;
}

export type CondicionIva =
  "responsable_inscripto" | "monotributo" | "exento" | "consumidor_final";

export const CONDICION_IVA_LABEL: Record<CondicionIva, string> = {
  responsable_inscripto: "Responsable Inscripto",
  monotributo: "Monotributo",
  exento: "Exento",
  consumidor_final: "Consumidor Final",
};

export interface Cliente {
  id: number;
  numeroCliente: string;
  nombre: string;
  razonSocial: string | null;
  cuit: string | null;
  condicionIva: CondicionIva | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  saldo?: number;
}

export interface VentaResumen {
  id: number;
  numeroRemito: number;
  fecha: string;
  totalImporte: number;
}

export type MetodoPago = "efectivo" | "transferencia" | "cheque";

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  cheque: "Cheque",
};

export interface Pago {
  id: number;
  ventaId: number | null;
  monto: number;
  metodo: MetodoPago | null;
  diasCheque: number | null;
  numeroCheque: string | null;
  banco: string | null;
  fecha: string;
  registradoPor: string | null;
}

export interface VentaItemDetalle {
  id: number;
  descripcion: string;
  kilos: number;
  precioKg: number;
  importe: number;
  cor: string;
  garron: string | null;
}

export interface VentaDetalle {
  id: number;
  numeroRemito: number;
  fecha: string;
  totalImporte: number;
  clienteId: number;
  clienteNumero: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteDireccion: string | null;
}

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface Deudor {
  id: number;
  nombre: string;
  saldo: number;
}

export interface ActividadItem {
  tipo: "venta" | "pago";
  clienteNombre: string;
  monto: number;
  fecha: string;
}

export interface EntregaHoyItem {
  clienteId: number;
  clienteNombre: string;
  repartidores: string;
  piezas: number;
}

export interface VentaHoyPorClienteItem {
  clienteId: number;
  clienteNombre: string;
  monto: number;
}

export interface Estadisticas {
  ventasHoy: { cantidad: number; total: number };
  ventasMes: { cantidad: number; total: number };
  stock: { reses: number; kilos: number };
  porCobrar: { total: number; clientes: number };
  topDeudores: Deudor[];
  actividadReciente: ActividadItem[];
  entregasHoy: EntregaHoyItem[];
  ventasHoyPorCliente: VentaHoyPorClienteItem[];
}

export interface PuntoVentaDiaria {
  fecha: string;
  cantidad: number;
  total: number;
}

export interface PuntoVentaMensual {
  mes: string;
  cantidad: number;
  total: number;
}

export interface TopCliente {
  id: number;
  nombre: string;
  total: number;
  cantidad: number;
}

export interface TopProductoVendido {
  descripcion: string;
  kilos: number;
  importe: number;
  piezas: number;
}

export interface StockPorClasificacion {
  clasificacion: string;
  cantidad: number;
  kilos: number;
}

export interface StockPorProducto {
  nombre: string;
  categoria: string;
  cantidad: number;
}

export interface MetodoPagoResumen {
  metodo: string;
  cantidad: number;
  total: number;
}

export interface PedidoPorEstado {
  estado: string;
  cantidad: number;
}

export interface ClientesNuevosPorMes {
  mes: string;
  cantidad: number;
}

export interface VentaPorDiaSemana {
  diaSemana: number;
  cantidad: number;
  total: number;
}

export interface HistorialDiaResumen {
  fecha: string;
  cantidadVentas: number;
  totalVentas: number;
  cantidadPedidos: number;
  totalCobros: number;
}

export interface HistorialVenta {
  id: number;
  numeroRemito: number;
  clienteNombre: string;
  totalImporte: number;
  fecha: string;
}

export interface HistorialPedido {
  id: number;
  clienteNombre: string;
  repartidorNombre: string;
  estado: EstadoPedido;
  total: number;
  piezas: number;
}

export interface HistorialPago {
  metodo: string;
  cantidad: number;
  total: number;
}

export interface HistorialProductoVendido {
  descripcion: string;
  kilos: number;
  importe: number;
  piezas: number;
}

export interface HistorialDiaDetalle {
  fecha: string;
  resumen: {
    cantidadVentas: number;
    totalVentas: number;
    cantidadPedidos: number;
    cantidadPagos: number;
    totalCobros: number;
    kilosVendidos: number;
  };
  ventas: HistorialVenta[];
  pedidos: HistorialPedido[];
  pagos: HistorialPago[];
  productosVendidos: HistorialProductoVendido[];
}

export interface EstadisticasDashboard {
  ventasPorDia: PuntoVentaDiaria[];
  ventasPorMes: PuntoVentaMensual[];
  topClientes: TopCliente[];
  topProductosVendidos: TopProductoVendido[];
  stockPorClasificacion: StockPorClasificacion[];
  stockPorProducto: StockPorProducto[];
  metodosPago: MetodoPagoResumen[];
  pedidosPorEstado: PedidoPorEstado[];
  kpis: {
    ticketPromedio: number;
    kilosVendidosMes: number;
    clientesActivosMes: number;
    ventasTotalHistorico: number;
    ventasMesAnterior: number;
    variacionMesPct: number | null;
  };
  clientesNuevosPorMes: ClientesNuevosPorMes[];
  ventasPorDiaSemana: VentaPorDiaSemana[];
}

export type CategoriaProducto =
  "vacuno" | "cerdo" | "toro" | "embutido" | "otro";
export type UnidadProducto = "kg" | "unidad";

export interface Producto {
  id: number;
  nombre: string;
  categoria: CategoriaProducto;
  tieneCodigoBarra: boolean;
  unidad: UnidadProducto;
  activo: boolean;
}

export interface ItemStock {
  id: number;
  productoId: number;
  productoNombre: string;
  unidad: UnidadProducto;
  loteId: number | null;
  cantidad: number;
  cantidadDisponible: number;
}

export type EstadoPedido = "pendiente" | "armado" | "cargado" | "entregado";

export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  pendiente: "Pendiente de armar",
  armado: "Armado",
  cargado: "Cargado en camioneta",
  entregado: "Entregado",
};

export interface PedidoItem {
  id: number;
  productoId: number;
  productoNombre: string;
  resId: number | null;
  cor: string | null;
  cantidad: number;
  precio: number;
  garron: string | null;
  tropa: string | null;
  nota: string | null;
  entregado: boolean;
}

export interface Pedido {
  id: number;
  clienteId: number;
  clienteNombre: string;
  repartidor: string;
  repartidorNombre: string | null;
  estado: EstadoPedido;
  fecha: string;
}

export interface PedidoDetalle extends Pedido {
  items: PedidoItem[];
  numeroRemito: number;
  clienteNumero: string;
  clienteTelefono: string | null;
  clienteDireccion: string | null;
  clienteRazonSocial: string | null;
  clienteCuit: string | null;
  clienteCondicionIva: CondicionIva | null;
}

export interface UnidadLive {
  id: string;
  nombre: string;
  posicion: { lat: number; lng: number };
  actualizadoEn: number;
}

export interface DispositivoGps {
  imei: string;
  unidadId: string;
  unidadNombre: string;
  nombre: string;
  activo: boolean;
  ultimoContactoMs: number | null;
}
