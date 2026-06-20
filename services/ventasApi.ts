import type { VentaDetalle, VentaItemDetalle, VentaResumen } from '@/types';
import { apiRequest } from './apiClient';

export interface ItemVentaInput {
  resId: number;
  descripcion: string;
  kilos: number;
  precioKg: number;
}

export async function crearVentaApi(input: {
  clienteId: number;
  items: ItemVentaInput[];
}): Promise<VentaResumen> {
  const data = await apiRequest<{ venta: VentaResumen }>('/admin/ventas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.venta;
}

export async function obtenerVentaApi(
  id: number
): Promise<{ venta: VentaDetalle; items: VentaItemDetalle[]; saldoCliente: number }> {
  return apiRequest(`/admin/ventas/${id}`);
}
