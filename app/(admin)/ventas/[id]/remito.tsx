import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { obtenerVentaApi } from '@/services/ventasApi';
import type { VentaDetalle, VentaItemDetalle } from '@/types';

function construirHtml(venta: VentaDetalle, items: VentaItemDetalle[], saldoCliente: number): string {
  const filas = items
    .map(
      (i) => `
        <tr>
          <td>Garrón ${i.garron ?? '–'} (${i.cor})</td>
          <td>${i.descripcion}</td>
          <td>${i.kilos} kg</td>
          <td>$${i.precioKg.toFixed(2)}</td>
          <td>$${i.importe.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `
    <html>
      <head><meta charset="utf-8" />
      <style>
        body { font-family: Helvetica, Arial, sans-serif; color: #2A2421; padding: 24px; }
        h1 { color: #15120F; margin-bottom: 0; letter-spacing: 1px; }
        .sub { color: #8A7E78; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border-bottom: 1px solid #dcd2c8; padding: 8px; text-align: left; font-size: 13px; }
        th { background: #15120F; color: #C9A24B; }
        .total { text-align: right; margin-top: 16px; font-size: 16px; font-weight: bold; color: #8C6D2F; }
        .saldo { text-align: right; margin-top: 4px; color: #B0392F; }
      </style>
      </head>
      <body>
        <h1>Don Ramón</h1>
        <p class="sub">Remito N° ${venta.numeroRemito} · ${new Date(venta.fecha).toLocaleDateString('es-AR')}</p>
        <p><strong>Cliente:</strong> #${venta.clienteNumero} — ${venta.clienteNombre}</p>
        ${venta.clienteTelefono ? `<p><strong>Teléfono:</strong> ${venta.clienteTelefono}</p>` : ''}
        ${venta.clienteDireccion ? `<p><strong>Dirección:</strong> ${venta.clienteDireccion}</p>` : ''}
        <table>
          <thead>
            <tr><th>Res</th><th>Descripción</th><th>Kilos</th><th>Precio/kg</th><th>Importe</th></tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <p class="total">Total: $${venta.totalImporte.toFixed(2)}</p>
        <p class="saldo">Saldo de cuenta del cliente: $${saldoCliente.toFixed(2)}</p>
      </body>
    </html>
  `;
}

export default function Remito() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venta, setVenta] = useState<VentaDetalle | null>(null);
  const [items, setItems] = useState<VentaItemDetalle[]>([]);
  const [saldoCliente, setSaldoCliente] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (!id) return;
    obtenerVentaApi(Number(id))
      .then((data) => {
        setVenta(data.venta);
        setItems(data.items);
        setSaldoCliente(data.saldoCliente);
      })
      .catch(() => setVenta(null))
      .finally(() => setCargando(false));
  }, [id]);

  const compartirRemito = async () => {
    if (!venta) return;
    setGenerando(true);
    try {
      const html = construirHtml(venta, items, saldoCliente);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      const disponible = await Sharing.isAvailableAsync();
      if (disponible) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Remito ${venta.numeroRemito}` });
      } else {
        Alert.alert('Remito generado', `PDF guardado en: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Remito', e instanceof Error ? e.message : 'No se pudo generar el remito.');
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

  if (!venta) {
    return (
      <Screen title="Remito" scrollable>
        <Text>No se encontró la venta.</Text>
      </Screen>
    );
  }

  return (
    <Screen title={`Remito N° ${venta.numeroRemito}`} subtitle={venta.clienteNombre} scrollable>
      <View style={styles.card}>
        <Text style={styles.label}>Cliente</Text>
        <Text style={styles.valor}>
          #{venta.clienteNumero} · {venta.clienteNombre}
        </Text>
        {items.map((i) => (
          <View key={i.id} style={styles.item}>
            <Text style={styles.valor}>
              Garrón {i.garron ?? '–'} · {i.descripcion}
            </Text>
            <Text style={styles.label}>
              {i.kilos} kg × ${i.precioKg.toFixed(2)} = ${i.importe.toFixed(2)}
            </Text>
          </View>
        ))}
        <Text style={styles.total}>Total: ${venta.totalImporte.toFixed(2)}</Text>
        <Text style={styles.saldo}>Saldo de cuenta: ${saldoCliente.toFixed(2)}</Text>
      </View>
      <Button label="DESCARGAR / COMPARTIR REMITO" loading={generando} onPress={() => void compartirRemito()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 6 },
  label: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
  valor: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.grisTexto },
  item: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1ECE7', marginTop: 6 },
  total: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.doradoOscuro, marginTop: 12, textAlign: 'right' },
  saldo: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.error, textAlign: 'right' },
});
