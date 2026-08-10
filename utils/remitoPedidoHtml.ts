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
    leyenda: "13px",
    empresaLinea: "14px",
    notaTitulo: "18px",
    notaCampo: "14px",
    direccion: "12px",
    campoLabel: "14px",
    campoValor: "14px",
    itemsTh: "13px",
    itemsTd: "13px",
    trazabilidad: "11px",
    totalLabel: "16px",
    totalValor: "18px",
    firmaTexto: "12px",
    logo: "56px",
  },
  original_duplicado: {
    leyenda: "9px",
    empresaLinea: "10px",
    notaTitulo: "13px",
    notaCampo: "10px",
    direccion: "9px",
    campoLabel: "10px",
    campoValor: "10px",
    itemsTh: "9px",
    itemsTd: "9px",
    trazabilidad: "8px",
    totalLabel: "12px",
    totalValor: "12px",
    firmaTexto: "9px",
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
        <tr>
          <td class="num">${item.cantidad}</td>
          <td class="desc">${item.productoNombre}${trazabilidad ? `<div class="trazabilidad">${trazabilidad}</div>` : ""}${item.nota ? `<div class="trazabilidad">${item.nota}</div>` : ""}</td>
          <td class="num">$${item.precio.toFixed(2)}</td>
          <td class="num">$${(item.cantidad * item.precio).toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  const filaVacia = '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
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
      <hr class="divisoria" />

      <div class="campo">
        <span class="campoLabel">Señor/es:</span>
        <span class="campoValor">#${pedido.clienteNumero} — ${pedido.clienteNombre}${pedido.clienteRazonSocial ? ` (${pedido.clienteRazonSocial})` : ""}</span>
      </div>
      <div class="condiciones">
        <span class="campoLabel">Domicilio:</span>
        <span class="campoValor">${pedido.clienteDireccion ?? ""}</span>
        <span class="campoLabel">C.U.I.T:</span>
        <span class="campoValorChico">${pedido.clienteCuit ?? ""}</span>
      </div>

      <table class="itemsTable">
        <thead>
          <tr><th>PESO</th><th>DESCRIPCION</th><th>P. Unit.</th><th>IMPORTE</th></tr>
        </thead>
        <tbody>${construirFilas(pedido)}</tbody>
      </table>

      <div class="pieRow">
        <div class="firma">
          <div class="firmaLinea"></div>
          <p class="firmaTexto">FIRMA</p>
        </div>
        <div class="totalRow">
          <span class="totalLabel">$</span>
          <span class="totalValor">${total.toFixed(2)}</span>
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
        .direccion { text-align: center; font-size: ${t.direccion}; margin: 4px 0 2px; }
        .divisoria { border: none; border-top: 1px solid #000; margin: 2px 0 4px; }
        .campo { display: flex; gap: 4px; align-items: baseline; border-bottom: 1px dotted #999; padding: 1px 2px; margin-bottom: 2px; }
        .campoLabel { font-weight: bold; font-size: ${t.campoLabel}; white-space: nowrap; }
        .campoValor { font-size: ${t.campoValor}; background: #f2f2f2; flex: 1; padding: 1px 4px; }
        .campoValorChico { font-size: ${t.campoValor}; background: #f2f2f2; padding: 1px 6px; }
        .condiciones { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; border-bottom: 1px dotted #999; padding: 1px 2px; }
        .itemsTable { width: 100%; border-collapse: collapse; margin-top: 2px; flex: 1; }
        .itemsTable th { border: 1px solid #000; background: #000; color: #fff; padding: 3px 5px; font-size: ${t.itemsTh}; }
        .itemsTable td { border: 1px solid #000; background: #fff; padding: 2px 5px; font-size: ${t.itemsTd}; height: 15px; }
        .itemsTable td.num { text-align: right; width: 15%; }
        .itemsTable td.desc { text-align: left; }
        .trazabilidad { font-size: ${t.trazabilidad}; color: #555; }
        .pieRow { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px; }
        .totalRow { display: flex; align-items: center; gap: 4px; }
        .totalLabel { font-weight: bold; font-size: ${t.totalLabel}; }
        .totalValor { border: 1px solid #000; background: #f2f2f2; padding: 3px 12px; font-weight: bold; font-size: ${t.totalValor}; min-width: 80px; text-align: right; }
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
