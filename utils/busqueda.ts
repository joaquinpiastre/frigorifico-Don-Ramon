const RANGO_DIACRITICOS = /[̀-ͯ]/g;

/**
 * Normaliza texto para comparar ignorando acentos, mayúsculas y signos de puntuación
 * (ej. "Pérez" === "perez", "Núm. 123" === "num 123").
 */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(RANGO_DIACRITICOS, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // signos de puntuación → espacio (CUIT con guiones, etc.)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Coincide si TODAS las palabras de la búsqueda aparecen en algún lugar del texto combinado de los campos,
 * sin importar el orden. Permite buscar "perez juan" y encontrar "Juan Pérez".
 */
export function coincideBusqueda(busqueda: string, ...campos: (string | null | undefined)[]): boolean {
  const busquedaNormalizada = normalizarTexto(busqueda);
  const palabras = busquedaNormalizada.split(' ').filter(Boolean);
  if (palabras.length === 0) return true;

  const textoCombinado = normalizarTexto(campos.filter(Boolean).join(' '));
  if (palabras.every((palabra) => textoCombinado.includes(palabra))) return true;

  // Fallback para CUIT/teléfono: "20123456783" debe encontrar "20-12345678-3"
  // aunque al normalizar queden separados por espacios en distintos puntos.
  const sinEspacios = (s: string) => s.replace(/\s+/g, '');
  return sinEspacios(textoCombinado).includes(sinEspacios(busquedaNormalizada));
}
