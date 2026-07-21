/**
 * expo-print en web ignora el HTML que se le pasa: su printAsync/printToFileAsync
 * llaman directo a window.print() sobre la pestaña actual (ver ExponentPrint.web.ts),
 * así que terminaba imprimiendo la pantalla de la app en vez del remito armado.
 * Acá abrimos una pestaña nueva con el HTML del remito y disparamos la impresión ahí,
 * para que "Guardar como PDF" del navegador tome el diseño real.
 */
export function imprimirHtmlEnNuevaVentana(html: string): boolean {
  const ventana = window.open("", "_blank");
  if (!ventana) return false;

  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();

  let impreso = false;
  const imprimir = () => {
    if (impreso) return;
    impreso = true;
    ventana.focus();
    ventana.print();
  };
  ventana.onload = imprimir;
  // Respaldo por si `onload` no dispara en algún navegador con about:blank
  setTimeout(imprimir, 300);

  return true;
}
