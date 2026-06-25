import type { ItemStock } from '@/types';
import { apiRequest } from './apiClient';

export async function registrarIngresoStockApi(input: { productoId: number; cantidad: number }): Promise<ItemStock> {
  const data = await apiRequest<{ itemStock: ItemStock }>('/stock-items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.itemStock;
}

export async function listarStockItemsApi(): Promise<ItemStock[]> {
  const data = await apiRequest<{ itemsStock: ItemStock[] }>('/stock-items');
  return data.itemsStock;
}
