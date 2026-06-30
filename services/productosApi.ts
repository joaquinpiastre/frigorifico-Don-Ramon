import type { CategoriaProducto, Producto, UnidadProducto } from "@/types";
import { apiRequest } from "./apiClient";

export async function listarProductosApi(filtros?: {
  q?: string;
  incluirInactivos?: boolean;
}): Promise<Producto[]> {
  const params = new URLSearchParams();
  if (filtros?.q) params.set("q", filtros.q);
  if (filtros?.incluirInactivos) params.set("incluirInactivos", "true");
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest<{ productos: Producto[] }>(
    `/productos${query}`,
  );
  return data.productos;
}

export async function crearProductoApi(input: {
  nombre: string;
  categoria: CategoriaProducto;
  tieneCodigoBarra: boolean;
  unidad: UnidadProducto;
}): Promise<Producto> {
  const data = await apiRequest<{ producto: Producto }>("/productos", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.producto;
}

export async function actualizarProductoApi(
  id: number,
  input: {
    nombre?: string;
    categoria?: CategoriaProducto;
    tieneCodigoBarra?: boolean;
    unidad?: UnidadProducto;
    activo?: boolean;
  },
): Promise<Producto> {
  const data = await apiRequest<{ producto: Producto }>(`/productos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.producto;
}

export async function eliminarProductoApi(id: number): Promise<void> {
  await apiRequest(`/productos/${id}`, { method: "DELETE" });
}
