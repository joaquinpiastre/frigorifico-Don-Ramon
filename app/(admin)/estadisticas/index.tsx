import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { obtenerEstadisticasDashboardApi } from '@/services/estadisticasApi';
import type { EstadisticasDashboard } from '@/types';

const ANCHO_GRAFICO = Dimensions.get('window').width - 56;

const COLORES_TORTA = [COLORS.dorado, COLORS.doradoOscuro, COLORS.exito, COLORS.advertencia, COLORS.error, '#6B7FD7', '#7D8A99'];

const chartConfig = {
  backgroundGradientFrom: COLORS.blanco,
  backgroundGradientTo: COLORS.blanco,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(140, 109, 47, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(42, 36, 33, ${opacity})`,
  propsForBackgroundLines: { stroke: COLORS.grisClaro },
  barPercentage: 0.6,
};

function formatoMes(mes: string): string {
  const [, m] = mes.split('-');
  const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return nombres[Number(m) - 1] ?? mes;
}

function formatoDiaCorto(fecha: string): string {
  const [, m, d] = fecha.split('-');
  return `${d}/${m}`;
}

export default function EstadisticasIndex() {
  const [data, setData] = useState<EstadisticasDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      setError(false);
      obtenerEstadisticasDashboardApi()
        .then((d) => activo && setData(d))
        .catch(() => activo && setError(true))
        .finally(() => activo && setCargando(false));
      return () => {
        activo = false;
      };
    }, [])
  );

  if (cargando) {
    return (
      <Screen title="Estadísticas" subtitle="Panel analítico" scrollable>
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 24 }} />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen title="Estadísticas" subtitle="Panel analítico" scrollable>
        <Text style={styles.vacio}>No se pudieron cargar las estadísticas.</Text>
      </Screen>
    );
  }

  const ventasPorDiaConDatos = data.ventasPorDia.filter((p) => p.cantidad > 0).length >= 2;
  const ventasPorMesConDatos = data.ventasPorMes.length >= 2;

  return (
    <Screen title="Estadísticas" subtitle="Panel analítico del negocio" scrollable>
      <View style={styles.grid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Ticket promedio</Text>
          <Text style={styles.kpiValor}>${data.kpis.ticketPromedio.toFixed(2)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Kilos vendidos (mes)</Text>
          <Text style={styles.kpiValor}>{data.kpis.kilosVendidosMes.toFixed(0)} kg</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Clientes activos (mes)</Text>
          <Text style={styles.kpiValor}>{data.kpis.clientesActivosMes}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Ventas histórico</Text>
          <Text style={styles.kpiValor}>${data.kpis.ventasTotalHistorico.toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.seccion}>Ventas — últimos 30 días</Text>
        {ventasPorDiaConDatos ? (
          <LineChart
            data={{
              labels: data.ventasPorDia.map((p) => formatoDiaCorto(p.fecha)).filter((_, i) => i % 4 === 0),
              datasets: [{ data: data.ventasPorDia.map((p) => p.total) }],
            }}
            width={ANCHO_GRAFICO}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={false}
          />
        ) : (
          <Text style={styles.statSub}>Todavía no hay suficientes datos de ventas diarias.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.seccion}>Ventas por mes (12 meses)</Text>
        {ventasPorMesConDatos ? (
          <BarChart
            data={{
              labels: data.ventasPorMes.map((p) => formatoMes(p.mes)),
              datasets: [{ data: data.ventasPorMes.map((p) => p.total) }],
            }}
            width={ANCHO_GRAFICO}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            yAxisLabel="$"
            yAxisSuffix=""
          />
        ) : (
          <Text style={styles.statSub}>Todavía no hay suficientes datos mensuales.</Text>
        )}
      </View>

      {data.stockPorClasificacion.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Stock por clasificación (kg)</Text>
          <PieChart
            data={data.stockPorClasificacion.map((s, i) => ({
              name: s.clasificacion,
              population: s.kilos,
              color: COLORES_TORTA[i % COLORES_TORTA.length],
              legendFontColor: COLORS.grisTexto,
              legendFontSize: 12,
            }))}
            width={ANCHO_GRAFICO}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="8"
          />
        </View>
      ) : null}

      {data.topClientes.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Top 10 clientes (histórico)</Text>
          {data.topClientes.map((c, i) => (
            <View key={c.id} style={styles.fila}>
              <Text style={styles.filaTexto}>
                {i + 1}. {c.nombre} <Text style={styles.filaSub}>({c.cantidad} compras)</Text>
              </Text>
              <Text style={styles.filaImporte}>${c.total.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.topProductosVendidos.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Más vendidos</Text>
          {data.topProductosVendidos.map((p, i) => (
            <View key={p.descripcion + i} style={styles.fila}>
              <Text style={styles.filaTexto}>
                {p.descripcion} <Text style={styles.filaSub}>({p.kilos.toFixed(0)} kg · {p.piezas} u.)</Text>
              </Text>
              <Text style={styles.filaImporte}>${p.importe.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.stockPorProducto.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Stock de productos (sin código de barras)</Text>
          {data.stockPorProducto.map((p, i) => (
            <View key={p.nombre + i} style={styles.fila}>
              <Text style={styles.filaTexto}>
                {p.nombre} <Text style={styles.filaSub}>({p.categoria})</Text>
              </Text>
              <Text style={styles.filaImporte}>{p.cantidad.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.metodosPago.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Pagos por método</Text>
          {data.metodosPago.map((m, i) => (
            <View key={m.metodo + i} style={styles.fila}>
              <Text style={styles.filaTexto}>
                {m.metodo} <Text style={styles.filaSub}>({m.cantidad} pagos)</Text>
              </Text>
              <Text style={styles.filaImporte}>${m.total.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.pedidosPorEstado.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Pedidos por estado</Text>
          {data.pedidosPorEstado.map((p, i) => (
            <View key={p.estado + i} style={styles.fila}>
              <Text style={styles.filaTexto}>{p.estado}</Text>
              <Text style={styles.filaImporte}>{p.cantidad}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  vacio: { fontFamily: 'Poppins_400Regular', color: COLORS.grisSecundario, marginTop: 20, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { flexBasis: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4 },
  kpiLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.grisSecundario },
  kpiValor: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.doradoOscuro },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8 },
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  chart: { borderRadius: 12, marginLeft: -16 },
  statSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grisClaro,
    gap: 8,
  },
  filaTexto: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisTexto, flexShrink: 1 },
  filaSub: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.grisSecundario },
  filaImporte: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.doradoOscuro },
});
