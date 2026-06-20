import type { CargaItem, CargaReparto } from '@/types';
import { apiRequest } from './apiClient';

export async function crearCargaApi(): Promise<CargaReparto> {
  const data = await apiRequest<{ carga: CargaReparto }>('/admin/cargas', { method: 'POST' });
  return data.carga;
}

export async function obtenerCargaApi(id: number): Promise<{ carga: CargaReparto; items: CargaItem[] }> {
  return apiRequest(`/admin/cargas/${id}`);
}

export async function escanearItemCargaApi(cargaId: number, cor: string): Promise<CargaItem> {
  const data = await apiRequest<{ item: { id: number; escaneadoEn: string; res: Omit<CargaItem, 'id' | 'escaneadoEn' | 'resId'> & { id: number } } }>(
    `/admin/cargas/${cargaId}/items`,
    { method: 'POST', body: JSON.stringify({ cor }) }
  );
  return {
    id: data.item.id,
    escaneadoEn: data.item.escaneadoEn,
    resId: data.item.res.id,
    cor: data.item.res.cor,
    garron: data.item.res.garron,
    clasificacion: data.item.res.clasificacion,
    kilosDisponibles: data.item.res.kilosDisponibles,
  };
}

export async function cerrarCargaApi(id: number): Promise<CargaReparto> {
  const data = await apiRequest<{ carga: CargaReparto }>(`/admin/cargas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ cerrada: true }),
  });
  return data.carga;
}
