import type { DispositivoGps, UnidadLive } from '@/types';
import { apiRequest } from './apiClient';

export async function obtenerPosicionesLiveApi(): Promise<UnidadLive[]> {
  const data = await apiRequest<{ unidades: UnidadLive[] }>('/gps/live');
  return data.unidades;
}

export async function listarDispositivosGpsApi(): Promise<DispositivoGps[]> {
  const data = await apiRequest<{ dispositivos: DispositivoGps[] }>('/admin/dispositivos-gps');
  return data.dispositivos;
}

export async function crearDispositivoGpsApi(input: {
  imei: string;
  unidadId: string;
  unidadNombre: string;
  nombreTracker: string;
}): Promise<void> {
  await apiRequest('/admin/dispositivos-gps', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function eliminarDispositivoGpsApi(imei: string): Promise<void> {
  await apiRequest(`/admin/dispositivos-gps/${imei}`, { method: 'DELETE' });
}
