export function formatoFechaCorta(iso: string | null | undefined): string {
  if (!iso) return "Sin fecha";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  return fecha.toLocaleDateString("es-AR", { timeZone: "UTC" });
}

export function aInputFecha(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}
