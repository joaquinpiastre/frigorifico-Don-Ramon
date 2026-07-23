import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { imprimirHtmlEnNuevaVentana } from '@/utils/imprimirHtml';
import { obtenerLogoBase64 } from '@/utils/logo';
import { construirHtmlRemitoPedido } from '@/utils/remitoPedidoHtml';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { obtenerPedidoApi } from '@/services/pedidosApi';
import type { PedidoDetalle } from '@/types';

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
      const html = construirHtmlRemitoPedido(pedido, logoBase64);
      if (Platform.OS === 'web') {
        const abierto = imprimirHtmlEnNuevaVentana(html);
        if (!abierto) {
          showAlert(
            'Remito',
            'Habilitá las ventanas emergentes del navegador para generar el remito.',
          );
        }
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
