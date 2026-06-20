import type { Estadisticas } from '@/types';
import { apiRequest } from './apiClient';

export async function obtenerEstadisticasApi(): Promise<Estadisticas> {
  return apiRequest('/admin/estadisticas');
}
