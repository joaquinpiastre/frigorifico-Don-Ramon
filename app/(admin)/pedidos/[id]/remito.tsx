import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { obtenerLogoBase64 } from '@/utils/logo';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { obtenerPedidoApi } from '@/services/pedidosApi';
import type { PedidoDetalle } from '@/types';

const FILAS_MINIMAS = 14;

function partesFecha(fechaIso: string): { dd: string; mm: string; yyyy: string } {
  const d = new Date(fechaIso);
  return {
    dd: String(d.getDate()).padStart(2, '0'),
    mm: String(d.getMonth() + 1).padStart(2, '0'),
    yyyy: String(d.getFullYear()),
  };
}

function construirFilas(pedido: PedidoDetalle): string {
  const filas = pedido.items
    .map((item) => {
      const trazabilidad = [
        item.cor ? `Cor ${item.cor}` : null,
        item.garron ? `Garrón ${item.garron}` : null,
        item.tropa ? `Tropa ${item.tropa}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      return `
        <tr>
          <td class="num">${item.cantidad}</td>
          <td class="desc">${item.productoNombre}${trazabilidad ? `<div class="trazabilidad">${trazabilidad}</div>` : ''}${item.nota ? `<div class="trazabilidad">${item.nota}</div>` : ''}</td>
          <td class="num">$${item.precio.toFixed(2)}</td>
          <td class="num">$${(item.cantidad * item.precio).toFixed(2)}</td>
        </tr>`;
    })
    .join('');

  const filaVacia = '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
  const vacias = Math.max(0, FILAS_MINIMAS - pedido.items.length);
  return filas + filaVacia.repeat(vacias);
}

function construirPagina(pedido: PedidoDetalle, logoBase64: string, leyenda: 'ORIGINAL' | 'DUPLICADO'): string {
  const total = pedido.items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);
  const { dd, mm, yyyy } = partesFecha(pedido.fecha);

  return `
    <div class="page">
      <div class="leyenda">${leyenda}</div>

      <table class="headerTable">
        <tr>
          <td class="logoCell"><img src="${logoBase64}" class="logo" /></td>
          <td class="empresaCell">
            <p class="empresaLinea">ABASTECEDORES</p>
            <p class="empresaLinea">CARNICERO</p>
            <p class="empresaLinea">MATARIFE</p>
          </td>
          <td class="notaCell">
            <p class="notaTitulo">NOTA DE PEDIDO</p>
            <p class="notaCampo">N° <span class="notaValor">${String(pedido.numeroRemito).padStart(6, '0')}</span></p>
            <p class="notaCampo">FECHA</p>
            <div class="fechaBoxes">
              <span class="fechaBox">${dd}</span>
              <span class="fechaBox">${mm}</span>
              <span class="fechaBox">${yyyy}</span>
            </div>
          </td>
        </tr>
      </table>

      <p class="direccion">Espínola 589&nbsp;&nbsp;&nbsp;Tel.: 2604 578682&nbsp;&nbsp;&nbsp;San Rafael - Mza.</p>
      <hr class="divisoria" />

      <div class="campo">
        <span class="campoLabel">Señor/es:</span>
        <span class="campoValor">#${pedido.clienteNumero} — ${pedido.clienteNombre}${pedido.clienteRazonSocial ? ` (${pedido.clienteRazonSocial})` : ''}</span>
      </div>
      <div class="campo">
        <span class="campoLabel">Domicilio:</span>
        <span class="campoValor">${pedido.clienteDireccion ?? ''}</span>
      </div>
      <div class="condiciones">
        <span class="campoLabel">Condiciones de Venta:</span>
        <span class="checkboxGroup">Contado <span class="checkbox"></span></span>
        <span class="checkboxGroup">Cta. Cte. <span class="checkbox"></span></span>
        <span class="campoLabel">C.U.I.T:</span>
        <span class="campoValorChico">${pedido.clienteCuit ?? ''}</span>
      </div>

      <table class="itemsTable">
        <thead>
          <tr><th>PESO</th><th>DESCRIPCION</th><th>P. Unitario</th><th>IMPORTE</th></tr>
        </thead>
        <tbody>${construirFilas(pedido)}</tbody>
      </table>

      <div class="totalRow">
        <span class="totalLabel">$</span>
        <span class="totalValor">${total.toFixed(2)}</span>
      </div>

      <div class="firma">
        <div class="firmaLinea"></div>
        <p class="firmaTexto">FIRMA</p>
      </div>
    </div>
  `;
}

function construirHtml(pedido: PedidoDetalle, logoBase64: string): string {
  return `
    <html>
      <head><meta charset="utf-8" />
      <style>
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #1c1c1c; margin: 0; }
        .page { position: relative; page-break-after: always; }
        .leyenda {
          position: absolute; top: -6px; right: 0;
          font-size: 10px; letter-spacing: 2px; font-weight: bold;
          color: #8C6D2F; border: 1.5px solid #8C6D2F; padding: 2px 10px; border-radius: 6px;
        }
        .headerTable { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .logoCell { width: 66px; }
        .logo { width: 58px; height: 58px; object-fit: contain; border-radius: 50%; border: 1px solid #C9A24B; }
        .empresaCell { padding-left: 10px; vertical-align: middle; }
        .empresaLinea { margin: 0; font-weight: bold; font-size: 13px; letter-spacing: 0.5px; }
        .notaCell { text-align: right; vertical-align: top; }
        .notaTitulo { font-weight: bold; font-size: 15px; margin: 0 0 4px; }
        .notaCampo { margin: 2px 0; font-size: 12px; }
        .notaValor { font-weight: bold; }
        .fechaBoxes { display: flex; justify-content: flex-end; gap: 4px; }
        .fechaBox { display: inline-block; width: 32px; text-align: center; border: 1px solid #000; background: #FBD7C4; padding: 3px 0; font-size: 12px; }
        .direccion { text-align: center; font-size: 12px; margin: 8px 0 4px; }
        .divisoria { border: none; border-top: 1.5px solid #000; margin: 4px 0 10px; }
        .campo { display: flex; gap: 6px; align-items: baseline; border-bottom: 1px dotted #999; padding: 3px 2px; margin-bottom: 4px; }
        .campoLabel { font-weight: bold; font-size: 12px; white-space: nowrap; }
        .campoValor { font-size: 12px; background: #FBD7C4; flex: 1; padding: 2px 6px; }
        .campoValorChico { font-size: 12px; background: #FBD7C4; padding: 2px 8px; }
        .condiciones { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
        .checkboxGroup { font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
        .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; background: #FBD7C4; }
        .itemsTable { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .itemsTable th { border: 1px solid #000; background: #15120F; color: #C9A24B; padding: 6px; font-size: 11px; }
        .itemsTable td { border: 1px solid #b98a6f; background: #FCE2D3; padding: 5px 6px; font-size: 11px; height: 17px; }
        .itemsTable td.num { text-align: right; width: 15%; }
        .itemsTable td.desc { text-align: left; }
        .trazabilidad { font-size: 10px; color: #6b5646; margin-top: 2px; }
        .totalRow { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 8px; }
        .totalLabel { font-weight: bold; font-size: 15px; }
        .totalValor { border: 1px solid #000; background: #FBD7C4; padding: 5px 16px; font-weight: bold; font-size: 15px; min-width: 100px; text-align: right; }
        .firma { margin-top: 46px; text-align: center; }
        .firmaLinea { border-top: 1px solid #000; width: 260px; margin: 0 auto 4px; }
        .firmaTexto { font-size: 11px; letter-spacing: 1px; margin: 0; }
      </style>
      </head>
      <body>
        ${construirPagina(pedido, logoBase64, 'ORIGINAL')}
        ${construirPagina(pedido, logoBase64, 'DUPLICADO')}
      </body>
    </html>
  `;
}

export default function RemitoPedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (!id) return;
    obtenerPedidoApi(Number(id))
      .then(setPedido)
      .catch(() => setPedido(null))
      .finally(() => setCargando(false));
  }, [id]);

  const compartirRemito = async () => {
    if (!pedido) return;
    setGenerando(true);
    try {
      const logoBase64 = await obtenerLogoBase64();
      const html = construirHtml(pedido, logoBase64);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }
      const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
      const disponible = await Sharing.isAvailableAsync();
      if (disponible) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Remito ${pedido.numeroRemito}` });
      } else {
        showAlert('Remito generado', `PDF guardado en: ${uri}`);
      }
    } catch (e) {
      showAlert('Remito', e instanceof Error ? e.message : 'No se pudo generar el remito.');
    } finally {
      setGenerando(false);
    }
  };

  if (cargando) {
    return (
      <Screen title="Remito" scrollable>
        <ActivityIndicator color={COLORS.negro} />
      </Screen>
    );
  }

  if (!pedido) {
    return (
      <Screen title="Remito" scrollable>
        <Text>No se encontró el pedido.</Text>
      </Screen>
    );
  }

  const total = pedido.items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);

  return (
    <Screen title={`Remito N° ${pedido.numeroRemito}`} subtitle={pedido.clienteNombre} scrollable>
      <View style={styles.card}>
        <Text style={styles.label}>Cliente</Text>
        <Text style={styles.valor}>
          #{pedido.clienteNumero} · {pedido.clienteNombre}
        </Text>
        {pedido.items.map((i) => (
          <View key={i.id} style={styles.item}>
            <Text style={styles.valor}>{i.productoNombre}</Text>
            <Text style={styles.label}>
              {i.cantidad} × ${i.precio.toFixed(2)} = ${(i.cantidad * i.precio).toFixed(2)}
            </Text>
          </View>
        ))}
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      </View>
      <Button
        label="GENERAR PDF (ORIGINAL Y DUPLICADO)"
        loading={generando}
        onPress={() => void compartirRemito()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 6 },
  label: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
  valor: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.grisTexto },
  item: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1ECE7', marginTop: 6 },
  total: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.doradoOscuro, marginTop: 12, textAlign: 'right' },
});
