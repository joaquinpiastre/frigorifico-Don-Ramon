import type {
  Cliente,
  CondicionIva,
  MetodoPago,
  Pago,
  ProductoEntregado,
  VentaResumen,
} from "@/types";
import { apiRequest } from "./apiClient";

export async function listarClientesApi(): Promise<Cliente[]> {
  const data = await apiRequest<{ clientes: Cliente[] }>("/admin/clientes");
  return data.clientes;
}

export async function crearClienteApi(input: {
  numeroCliente: string;
  nombre: string;
  razonSocial?: string;
  cuit?: string;
  condicionIva?: CondicionIva;
  telefono?: string;
  direccion?: string;
}): Promise<Cliente> {
  const data = await apiRequest<{ cliente: Cliente }>("/admin/clientes", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.cliente;
}

export async function actualizarClienteApi(
  id: number,
  input: {
    nombre?: string;
    razonSocial?: string;
    cuit?: string;
    condicionIva?: CondicionIva;
    telefono?: string;
    direccion?: string;
    activo?: boolean;
  },
): Promise<Cliente> {
  const data = await apiRequest<{ cliente: Cliente }>(`/admin/clientes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.cliente;
}

export async function obtenerClienteApi(
  id: number,
): Promise<{
  cliente: Cliente;
  ventas: VentaResumen[];
  pagos: Pago[];
  productosEntregados: ProductoEntregado[];
  saldo: number;
}> {
  return apiRequest(`/admin/clientes/${id}`);
}

export async function eliminarClienteApi(id: number): Promise<void> {
  await apiRequest(`/admin/clientes/${id}`, { method: "DELETE" });
}

export async function registrarPagoApi(input: {
  clienteId: number;
  ventaId?: number;
  monto: number;
  metodo?: MetodoPago;
  diasCheque?: number;
  numeroCheque?: string;
  banco?: string;
}): Promise<Pago> {
  const data = await apiRequest<{ pago: Pago }>("/admin/pagos", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.pago;
}
