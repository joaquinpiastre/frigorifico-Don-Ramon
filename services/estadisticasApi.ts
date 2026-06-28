import type { Estadisticas, EstadisticasDashboard } from '@/types';
import { apiRequest } from './apiClient';

export async function obtenerEstadisticasApi(): Promise<Estadisticas> {
  return apiRequest('/admin/estadisticas');
}

export async function obtenerEstadisticasDashboardApi(): Promise<EstadisticasDashboard> {
  return apiRequest('/admin/estadisticas/dashboard');
}
