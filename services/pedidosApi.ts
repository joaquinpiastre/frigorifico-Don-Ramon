import type { EstadoPedido, Pedido, PedidoDetalle } from "@/types";
import { apiRequest } from "./apiClient";

export async function crearPedidoApi(input: {
  clienteId: number;
  repartidor: string;
  items: {
    productoId: number;
    cantidad: number;
    precio: number;
    garron?: string;
    tropa?: string;
    nota?: string;
    resId?: number;
  }[];
}): Promise<{ pedidoId: number }> {
  return apiRequest("/pedidos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listarPedidosApi(filtros?: {
  estado?: EstadoPedido;
  repartidor?: string;
}): Promise<Pedido[]> {
  const params = new URLSearchParams();
  if (filtros?.estado) params.set("estado", filtros.estado);
  if (filtros?.repartidor) params.set("repartidor", filtros.repartidor);
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest<{ pedidos: Pedido[] }>(`/pedidos${query}`);
  return data.pedidos;
}

export async function obtenerPedidoApi(id: number): Promise<PedidoDetalle> {
  const data = await apiRequest<{
    pedido: Omit<PedidoDetalle, "items">;
    items: PedidoDetalle["items"];
  }>(`/pedidos/${id}`);
  return { ...data.pedido, items: data.items };
}

export async function armarPedidoApi(id: number): Promise<void> {
  await apiRequest(`/pedidos/${id}/armar`, { method: "PATCH" });
}

export async function cargarPedidoApi(id: number): Promise<void> {
  await apiRequest(`/pedidos/${id}/cargar`, { method: "PATCH" });
}

export async function entregarPedidoApi(id: number): Promise<void> {
  await apiRequest(`/pedidos/${id}/entregar`, { method: "PATCH" });
}

export async function repesarItemApi(
  pedidoId: number,
  itemId: number,
  cantidad: number,
): Promise<void> {
  await apiRequest(`/pedidos/${pedidoId}/items/${itemId}/repesar`, {
    method: "PATCH",
    body: JSON.stringify({ cantidad }),
  });
}

export async function editarPedidoApi(
  id: number,
  input: {
    repartidor?: string;
    items: {
      productoId: number;
      cantidad: number;
      precio: number;
      garron?: string;
      tropa?: string;
      nota?: string;
      resId?: number;
    }[];
  },
): Promise<void> {
  await apiRequest(`/pedidos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function eliminarPedidoApi(id: number): Promise<void> {
  await apiRequest(`/pedidos/${id}`, { method: "DELETE" });
}
