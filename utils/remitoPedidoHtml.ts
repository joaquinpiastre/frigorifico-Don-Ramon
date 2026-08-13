import type { PedidoDetalle } from "@/types";

export type ModoRemitoPedido = "original" | "original_duplicado";

// Pocas filas: cuando la hoja tiene que entrar dos veces (original + duplicado)
// cada mitad dispone de mucho menos alto que una hoja de copia única.
const FILAS_MINIMAS = 6;

// Dos escalas de tipografía: al compartir sale una sola copia (ORIGINAL) y aprovecha
// la hoja entera, así que puede ser bien grande; al descargar entran las dos copias
// (original + duplicado) en la misma hoja, así que el tamaño es más ajustado.
const TAMANOS: Record<
  ModoRemitoPedido,
  {
    leyenda: string;
    empresaLinea: string;
    notaTitulo: string;
    notaCampo: string;
    direccion: string;
    campoLabel: string;
    campoValor: string;
    itemsTh: string;
    itemsTd: string;
    trazabilidad: string;
    totalLabel: string;
    totalValor: string;
    firmaTexto: string;
    logo: string;
  }
> = {
  original: {
    leyenda: "14px",
    empresaLinea: "15px",
    notaTitulo: "20px",
    notaCampo: "16px",
    direccion: "13px",
    campoLabel: "16px",
    campoValor: "17px",
    itemsTh: "15px",
    itemsTd: "17px",
    trazabilidad: "13px",
    totalLabel: "18px",
    totalValor: "22px",
    firmaTexto: "13px",
    logo: "56px",
  },
  original_duplicado: {
    leyenda: "10px",
    empresaLinea: "11px",
    notaTitulo: "15px",
    notaCampo: "11px",
    direccion: "10px",
    campoLabel: "12px",
    campoValor: "13px",
    itemsTh: "11px",
    itemsTd: "12px",
    trazabilidad: "10px",
    totalLabel: "13px",
    totalValor: "15px",
    firmaTexto: "10px",
    logo: "34px",
  },
};

function partesFecha(fechaIso: string): { dd: string; mm: string; yyyy: string } {
  const d = new Date(fechaIso);
  return {
    dd: String(d.getDate()).padStart(2, "0"),
    mm: String(d.getMonth() + 1).padStart(2, "0"),
    yyyy: String(d.getFullYear()),
  };
}

function construirFilas(pedido: PedidoDetalle): string {
  const filas = pedido.items
    .map((item) => {
      const trazabilidad = item.garron ? `Garrón ${item.garron}` : "";
      return `
        <div class="fila">
          <span class="cant">${item.cantidad}</span>
          <span class="desc">${item.productoNombre}${trazabilidad ? `<div class="trazabilidad">${trazabilidad}</div>` : ""}${item.nota ? `<div class="trazabilidad">${item.nota}</div>` : ""}</span>
          <span class="precio">$${item.precio.toFixed(2)}</span>
          <span class="importe">$${(item.cantidad * item.precio).toFixed(2)}</span>
        </div>`;
    })
    .join("");

  const filaVacia = '<div class="fila filaVacia">&nbsp;</div>';
  const vacias = Math.max(0, FILAS_MINIMAS - pedido.items.length);
  return filas + filaVacia.repeat(vacias);
}

function construirMitad(
  pedido: PedidoDetalle,
  logoBase64: string,
  leyenda: "ORIGINAL" | "DUPLICADO",
): string {
  const total = pedido.items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);
  const { dd, mm, yyyy } = partesFecha(pedido.fecha);

  return `
    <div class="mitad">
      <div class="leyenda">${leyenda}</div>

      <table class="headerTable">
        <tr>
          <td class="logoCell"><img src="${logoBase64}" class="logo" /></td>
          <td class="empresaCell">
            <p class="empresaLinea">ABASTECEDORES · CARNICERO · MATARIFE</p>
          </td>
          <td class="notaCell">
            <p class="notaTitulo">NOTA DE PEDIDO</p>
            <p class="notaCampo">N° <span class="notaValor">${String(pedido.numeroRemito).padStart(6, "0")}</span> — ${dd}/${mm}/${yyyy}</p>
          </td>
        </tr>
      </table>

      <p class="direccion">Espínola 589 · Tel.: 2604 578682 · San Rafael - Mza.</p>

      <div class="campo">
        <span class="campoLabel">Señor/es</span>
        <span class="campoValor">#${pedido.clienteNumero} — ${pedido.clienteNombre}${pedido.clienteRazonSocial ? ` (${pedido.clienteRazonSocial})` : ""}</span>
      </div>
      <div class="campo">
        <span class="campoLabel">Domicilio</span>
        <span class="campoValor">${pedido.clienteDireccion ?? ""}</span>
      </div>
      <div class="campo">
        <span class="campoLabel">C.U.I.T.</span>
        <span class="campoValor">${pedido.clienteCuit ?? ""}</span>
      </div>

      <div class="itemsHead">
        <span class="cant">CANT.</span>
        <span class="desc">DESCRIPCIÓN</span>
        <span class="precio">P. UNIT.</span>
        <span class="importe">IMPORTE</span>
      </div>
      <div class="items">${construirFilas(pedido)}</div>

      <div class="pieRow">
        <div class="firma">
          <div class="firmaLinea"></div>
          <p class="firmaTexto">FIRMA</p>
        </div>
        <div class="totalRow">
          <span class="totalLabel">TOTAL</span>
          <span class="totalValor">$${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
}

export function construirHtmlRemitoPedido(
  pedido: PedidoDetalle,
  logoBase64: string,
  modo: ModoRemitoPedido = "original_duplicado",
): string {
  const t = TAMANOS[modo];
  const cuerpo =
    modo === "original"
      ? construirMitad(pedido, logoBase64, "ORIGINAL")
      : `${construirMitad(pedido, logoBase64, "ORIGINAL")}
         <div class="corte">✂ CORTAR AQUÍ</div>
         ${construirMitad(pedido, logoBase64, "DUPLICADO")}`;

  return `
    <html>
      <head><meta charset="utf-8" />
      <style>
        @page { size: A4; margin: 8mm; }
        * { box-sizing: border-box; }
        html, body { height: 100%; }
        body { font-family: Helvetica, Arial, sans-serif; color: #1c1c1c; margin: 0; }
        .hoja { display: flex; flex-direction: column; height: 100%; }
        .mitad { position: relative; flex: 1 1 ${modo === "original" ? "100%" : "50%"}; padding: ${modo === "original" ? "10px 8px" : "6px 4px"}; overflow: hidden; display: flex; flex-direction: column; }
        .corte {
          flex: none;
          display: flex; align-items: center; gap: 6px;
          color: #666; font-size: 9px; letter-spacing: 1px;
          margin: 2px 0;
        }
        .corte::before, .corte::after { content: ""; flex: 1; border-top: 1px dashed #999; }
        .leyenda {
          position: absolute; top: -2px; right: 2px;
          font-size: ${t.leyenda}; letter-spacing: 1.5px; font-weight: bold;
          color: #000; border: 1.2px solid #000; padding: 2px 10px; border-radius: 5px;
        }
        .headerTable { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .logoCell { width: ${t.logo}; }
        .logo { width: ${t.logo}; height: ${t.logo}; object-fit: contain; border-radius: 50%; border: 1px solid #000; filter: grayscale(100%); }
        .empresaCell { padding-left: 8px; vertical-align: middle; }
        .empresaLinea { margin: 0; font-weight: bold; font-size: ${t.empresaLinea}; letter-spacing: 0.3px; }
        .notaCell { text-align: right; vertical-align: middle; }
        .notaTitulo { font-weight: bold; font-size: ${t.notaTitulo}; margin: 0 0 2px; }
        .notaCampo { margin: 0; font-size: ${t.notaCampo}; }
        .notaValor { font-weight: bold; }
        .direccion { text-align: center; font-size: ${t.direccion}; margin: 4px 0 8px; padding-bottom: 6px; border-bottom: 1px solid #000; }
        .campo { display: flex; align-items: baseline; gap: 8px; margin-bottom: 5px; }
        .campoLabel { font-weight: bold; font-size: ${t.campoLabel}; white-space: nowrap; color: #444; }
        .campoValor { font-size: ${t.campoValor}; flex: 1; border-bottom: 1px solid #999; padding-bottom: 2px; font-weight: 600; }
        .itemsHead { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-bottom: 4px; border-bottom: 2px solid #000; font-weight: bold; font-size: ${t.itemsTh}; letter-spacing: 0.5px; color: #444; }
        .items { flex: 1; }
        .fila { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #ddd; font-size: ${t.itemsTd}; }
        .filaVacia { min-height: 1.6em; color: transparent; }
        .cant { width: 12%; text-align: center; }
        .desc { flex: 1; text-align: left; font-weight: 600; }
        .precio { width: 18%; text-align: right; }
        .importe { width: 20%; text-align: right; font-weight: 600; }
        .trazabilidad { font-size: ${t.trazabilidad}; color: #555; font-weight: normal; }
        .pieRow { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; }
        .totalRow { display: flex; align-items: baseline; gap: 8px; border-top: 2px solid #000; padding-top: 4px; }
        .totalLabel { font-weight: bold; font-size: ${t.totalLabel}; letter-spacing: 0.5px; color: #444; }
        .totalValor { font-weight: bold; font-size: ${t.totalValor}; min-width: 80px; text-align: right; }
        .firma { text-align: center; }
        .firmaLinea { border-top: 1px solid #000; width: 150px; margin: 0 auto 2px; }
        .firmaTexto { font-size: ${t.firmaTexto}; letter-spacing: 0.5px; margin: 0; }
      </style>
      </head>
      <body>
        <div class="hoja">
          ${cuerpo}
        </div>
      </body>
    </html>
  `;
}
