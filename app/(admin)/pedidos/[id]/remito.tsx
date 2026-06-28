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
import { CONDICION_IVA_LABEL, type PedidoDetalle } from '@/types';

function construirPagina(pedido: PedidoDetalle, logoBase64: string, leyenda: 'ORIGINAL' | 'DUPLICADO'): string {
  const total = pedido.items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);
  const cantidadBultos = pedido.items.length;

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
          <td>${item.productoNombre}${trazabilidad ? `<div class="trazabilidad">${trazabilidad}</div>` : ''}</td>
          <td class="num">${item.cantidad}</td>
          <td class="num">$${item.precio.toFixed(2)}</td>
          <td class="num">$${(item.cantidad * item.precio).toFixed(2)}</td>
        </tr>`;
    })
    .join('');

  return `
    <div class="page">
      <div class="leyenda">${leyenda}</div>
      <div class="header">
        <img src="${logoBase64}" class="logo" />
        <div class="empresa">
          <h1>Don Ramón</h1>
          <p class="sub">Frigorífico · Control de stock y reparto</p>
        </div>
        <div class="remitoNro">
          <p class="label">Remito N°</p>
          <p class="nro">${String(pedido.numeroRemito).padStart(6, '0')}</p>
          <p class="label">${new Date(pedido.fecha).toLocaleDateString('es-AR')}</p>
        </div>
      </div>

      <div class="datosCliente">
        <div>
          <p class="label">Cliente</p>
          <p class="valor">#${pedido.clienteNumero} — ${pedido.clienteNombre}</p>
          ${pedido.clienteRazonSocial ? `<p class="valor">${pedido.clienteRazonSocial}</p>` : ''}
          ${pedido.clienteCuit ? `<p class="valor">CUIT: ${pedido.clienteCuit}</p>` : ''}
          ${pedido.clienteCondicionIva ? `<p class="valor">${CONDICION_IVA_LABEL[pedido.clienteCondicionIva]}</p>` : ''}
        </div>
        <div>
          ${pedido.clienteDireccion ? `<p class="valor"><strong>Dirección:</strong> ${pedido.clienteDireccion}</p>` : ''}
          ${pedido.clienteTelefono ? `<p class="valor"><strong>Teléfono:</strong> ${pedido.clienteTelefono}</p>` : ''}
          <p class="valor"><strong>Repartidor:</strong> ${pedido.repartidorNombre ?? pedido.repartidor}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Detalle</th><th class="num">Cantidad</th><th class="num">Precio</th><th class="num">Importe</th></tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>

      <div class="resumen">
        <p class="bultos">${cantidadBultos} ítem(s)</p>
        <p class="total">Total: $${total.toFixed(2)}</p>
      </div>

      <div class="firmas">
        <div class="firma"><p>Firma del repartidor</p></div>
        <div class="firma"><p>Firma y aclaración del receptor</p></div>
      </div>
    </div>
  `;
}

function construirHtml(pedido: PedidoDetalle, logoBase64: string): string {
  return `
    <html>
      <head><meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #2A2421; margin: 0; }
        .page { padding: 28px; page-break-after: always; position: relative; }
        .leyenda {
          position: absolute; top: 24px; right: 28px;
          font-size: 11px; letter-spacing: 2px; font-weight: bold;
          color: #8C6D2F; border: 1.5px solid #8C6D2F; padding: 3px 10px; border-radius: 6px;
        }
        .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #15120F; padding-bottom: 12px; }
        .logo { width: 56px; height: 56px; object-fit: contain; border-radius: 10px; border: 1px solid #C9A24B; }
        .empresa { flex: 1; }
        .empresa h1 { margin: 0; color: #15120F; letter-spacing: 1px; }
        .sub { color: #8A7E78; margin: 2px 0 0; font-size: 12px; }
        .remitoNro { text-align: right; }
        .remitoNro .nro { font-size: 20px; font-weight: bold; color: #8C6D2F; margin: 0; }
        .label { font-size: 11px; color: #8A7E78; margin: 0; }
        .datosCliente { display: flex; justify-content: space-between; gap: 24px; margin-top: 16px; }
        .datosCliente > div { flex: 1; }
        .valor { font-size: 13px; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th, td { border-bottom: 1px solid #dcd2c8; padding: 8px; text-align: left; font-size: 13px; }
        th { background: #15120F; color: #C9A24B; }
        .num { text-align: right; }
        .trazabilidad { font-size: 11px; color: #8A7E78; margin-top: 2px; }
        .resumen { display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; }
        .bultos { color: #8A7E78; font-size: 12px; }
        .total { font-size: 16px; font-weight: bold; color: #8C6D2F; }
        .firmas { display: flex; gap: 40px; margin-top: 60px; }
        .firma { flex: 1; border-top: 1px solid #8A7E78; padding-top: 4px; text-align: center; font-size: 11px; color: #8A7E78; }
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
      const { uri } = await Print.printToFileAsync({ html });
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
