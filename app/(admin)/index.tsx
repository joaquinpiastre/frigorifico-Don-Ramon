import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { obtenerEstadisticasApi } from '@/services/estadisticasApi';
import { useAppStore } from '@/store/useAppStore';
import type { Estadisticas } from '@/types';

export default function AdminHome() {
  const { usuario, resetSesion } = useAppStore();
  const esAdmin = usuario?.rol === 'admin';

  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      obtenerEstadisticasApi()
        .then((data) => activo && setStats(data))
        .catch(() => activo && setStats(null))
        .finally(() => activo && setCargando(false));
      return () => {
        activo = false;
      };
    }, [])
  );

  return (
    <Screen title={`Hola, ${usuario?.nombre ?? ''}`} subtitle="Don Ramón · Control de Stock" scrollable>
      {cargando ? (
        <ActivityIndicator color={COLORS.negro} style={{ marginVertical: 12 }} />
      ) : stats ? (
        <>
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ventas hoy</Text>
              <Text style={styles.statValor}>${stats.ventasHoy.total.toFixed(2)}</Text>
              <Text style={styles.statSub}>{stats.ventasHoy.cantidad} ventas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ventas del mes</Text>
              <Text style={styles.statValor}>${stats.ventasMes.total.toFixed(2)}</Text>
              <Text style={styles.statSub}>{stats.ventasMes.cantidad} ventas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Stock disponible</Text>
              <Text style={styles.statValor}>{stats.stock.kilos.toFixed(0)} kg</Text>
              <Text style={styles.statSub}>{stats.stock.reses} reses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Por cobrar</Text>
              <Text style={[styles.statValor, stats.porCobrar.total > 0 && styles.statValorAlerta]}>
                ${stats.porCobrar.total.toFixed(2)}
              </Text>
              <Text style={styles.statSub}>{stats.porCobrar.clientes} clientes deudores</Text>
            </View>
          </View>

          {stats.topDeudores.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.seccion}>Top deudores</Text>
              {stats.topDeudores.map((d) => (
                <View key={d.id} style={styles.fila} onTouchEnd={() => router.push(`/(admin)/clientes/${d.id}`)}>
                  <Text style={styles.filaTexto}>{d.nombre}</Text>
                  <Text style={styles.filaImporte}>${d.saldo.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {stats.actividadReciente.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.seccion}>Actividad reciente</Text>
              {stats.actividadReciente.map((a, i) => (
                <View key={i} style={styles.fila}>
                  <Text style={styles.filaTexto}>
                    {a.tipo === 'venta' ? 'Venta a ' : 'Pago de '}
                    {a.clienteNombre}
                  </Text>
                  <Text style={styles.filaImporte}>${a.monto.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={styles.seccion}>Accesos</Text>
      <Button
        label="STOCK DE RESES"
        iconLeft={<Ionicons name="cube-outline" size={18} color={COLORS.blanco} />}
        onPress={() => router.push('/(admin)/stock')}
      />
      <Button
        label="NUEVA VENTA"
        variant="secondary"
        iconLeft={<Ionicons name="receipt-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(admin)/ventas/nueva')}
      />
      <Button
        label="CLIENTES"
        variant="secondary"
        iconLeft={<Ionicons name="people-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(admin)/clientes')}
      />
      <Button
        label="CARGA DE REPARTO"
        variant="secondary"
        iconLeft={<Ionicons name="car-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(admin)/reparto/nueva')}
      />
      <Button
        label="MAPA EN VIVO"
        variant="secondary"
        iconLeft={<Ionicons name="map-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(admin)/mapa')}
      />
      {esAdmin ? (
        <>
          <Button
            label="USUARIOS"
            variant="secondary"
            iconLeft={<Ionicons name="key-outline" size={18} color={COLORS.negro} />}
            onPress={() => router.push('/(admin)/usuarios')}
          />
          <Button
            label="RASTREADORES"
            variant="secondary"
            iconLeft={<Ionicons name="navigate-outline" size={18} color={COLORS.negro} />}
            onPress={() => router.push('/(admin)/rastreadores')}
          />
        </>
      ) : null}
      <Button
        label="CERRAR SESIÓN"
        variant="danger"
        iconLeft={<Ionicons name="log-out-outline" size={18} color={COLORS.blanco} />}
        onPress={() => {
          resetSesion();
          router.replace('/(auth)/login');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  statLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.grisSecundario },
  statValor: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: COLORS.doradoOscuro },
  statValorAlerta: { color: COLORS.error },
  statSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4 },
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto, marginTop: 8 },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grisClaro,
  },
  filaTexto: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisTexto, flexShrink: 1 },
  filaImporte: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.doradoOscuro },
});
