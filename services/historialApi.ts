import type { HistorialDiaDetalle, HistorialDiaResumen } from "@/types";
import { apiRequest } from "./apiClient";

export async function obtenerHistorialMesApi(
  mes: string,
): Promise<HistorialDiaResumen[]> {
  const data = await apiRequest<{ dias: HistorialDiaResumen[] }>(
    `/admin/historial/mes?mes=${mes}`,
  );
  return data.dias;
}

export async function obtenerHistorialDiaApi(
  fecha: string,
): Promise<HistorialDiaDetalle> {
  return apiRequest(`/admin/historial/dia?fecha=${fecha}`);
}
