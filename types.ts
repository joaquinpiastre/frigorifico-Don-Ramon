export type RolUsuario = 'admin' | 'operador';

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

export type EstadoRes = 'en_stock' | 'agotada';

export interface Res {
  id: number;
  loteId: number;
  cor: string;
  garron: string | null;
  clasificacion: string | null;
  kilosIngreso: number;
  kilosDisponibles: number;
  estado: EstadoRes;
}

export type CondicionIva = 'responsable_inscripto' | 'monotributo' | 'exento' | 'consumidor_final';

export const CONDICION_IVA_LABEL: Record<CondicionIva, string> = {
  responsable_inscripto: 'Responsable Inscripto',
  monotributo: 'Monotributo',
  exento: 'Exento',
  consumidor_final: 'Consumidor Final',
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

export interface Pago {
  id: number;
  ventaId: number | null;
  monto: number;
  metodo: string | null;
  fecha: string;
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
  tipo: 'venta' | 'pago';
  clienteNombre: string;
  monto: number;
  fecha: string;
}

export interface Estadisticas {
  ventasHoy: { cantidad: number; total: number };
  ventasMes: { cantidad: number; total: number };
  stock: { reses: number; kilos: number };
  porCobrar: { total: number; clientes: number };
  topDeudores: Deudor[];
  actividadReciente: ActividadItem[];
}

export interface CargaReparto {
  id: number;
  repartidor: string;
  fecha: string;
  cerrada: boolean;
}

export interface CargaItem {
  id: number;
  escaneadoEn: string;
  resId: number;
  cor: string;
  garron: string | null;
  clasificacion: string | null;
  kilosDisponibles: number;
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
