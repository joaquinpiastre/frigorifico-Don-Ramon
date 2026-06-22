import type { LoteIngreso, Res } from '@/types';
import { apiRequest } from './apiClient';

export async function crearLoteApi(input: {
  numeroTropa: string;
  dte?: string;
  fechaFaena?: string;
  establecimiento?: string;
  kilosVivosTotal?: number;
}): Promise<LoteIngreso> {
  const data = await apiRequest<{ lote: LoteIngreso }>('/admin/lotes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.lote;
}

export async function listarLotesApi(): Promise<LoteIngreso[]> {
  const data = await apiRequest<{ lotes: LoteIngreso[] }>('/admin/lotes');
  return data.lotes;
}

export async function crearResApi(input: {
  loteId: number;
  cor: string;
  garron?: string;
  clasificacion?: string;
  kilos: number;
}): Promise<Res> {
  const data = await apiRequest<{ res: Res }>('/admin/reses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.res;
}

export async function actualizarResApi(
  id: number,
  input: { garron?: string; clasificacion?: string; kilosDisponibles?: number; estado?: 'en_stock' | 'agotada' }
): Promise<Res> {
  const data = await apiRequest<{ res: Res }>(`/admin/reses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.res;
}

export async function listarResesApi(filtros?: {
  estado?: 'en_stock' | 'agotada';
  q?: string;
  loteId?: number;
  limit?: number;
}): Promise<Res[]> {
  const params = new URLSearchParams();
  if (filtros?.estado) params.set('estado', filtros.estado);
  if (filtros?.q) params.set('q', filtros.q);
  if (filtros?.loteId) params.set('loteId', String(filtros.loteId));
  if (filtros?.limit) params.set('limit', String(filtros.limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiRequest<{ reses: Res[] }>(`/admin/reses${query}`);
  return data.reses;
}

export async function buscarResPorCodigoApi(codigo: string): Promise<Res | null> {
  try {
    const data = await apiRequest<{ res: Res }>(`/admin/reses/${encodeURIComponent(codigo)}`);
    return data.res;
  } catch {
    return null;
  }
}
