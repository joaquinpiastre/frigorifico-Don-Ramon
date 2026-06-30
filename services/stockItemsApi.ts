import type { ItemStock } from "@/types";
import { apiRequest } from "./apiClient";

export async function registrarIngresoStockApi(input: {
  productoId: number;
  loteId?: number;
  cantidad: number;
}): Promise<ItemStock> {
  const data = await apiRequest<{ itemStock: ItemStock }>("/stock-items", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.itemStock;
}

export async function listarStockItemsApi(filtros?: {
  loteId?: number;
}): Promise<ItemStock[]> {
  const params = new URLSearchParams();
  if (filtros?.loteId) params.set("loteId", String(filtros.loteId));
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest<{ itemsStock: ItemStock[] }>(
    `/stock-items${query}`,
  );
  return data.itemsStock;
}
