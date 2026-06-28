import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  obtenerEstadisticasApi,
  obtenerEstadisticasDashboardApi,
} from "@/services/estadisticasApi";
import type { Estadisticas, EstadisticasDashboard } from "@/types";

const ANCHO_GRAFICO = Dimensions.get("window").width - 56;

const COLORES_TORTA = [
  COLORS.dorado,
  COLORS.doradoOscuro,
  COLORS.exito,
  COLORS.advertencia,
  COLORS.error,
  "#6B7FD7",
  "#7D8A99",
  "#B58FD1",
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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
  const [, m] = mes.split("-");
  const nombres = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return nombres[Number(m) - 1] ?? mes;
}

function formatoDiaCorto(fecha: string): string {
  const [, m, d] = fecha.split("-");
  return `${d}/${m}`;
}

function aTorta(items: { nombre: string; valor: number }[]): {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}[] {
  return items
    .filter((i) => i.valor > 0)
    .map((i, idx) => ({
      name: i.nombre,
      population: i.valor,
      color: COLORES_TORTA[idx % COLORES_TORTA.length],
      legendFontColor: COLORS.grisTexto,
      legendFontSize: 12,
    }));
}

export default function EstadisticasIndex() {
  const [resumen, setResumen] = useState<Estadisticas | null>(null);
  const [data, setData] = useState<EstadisticasDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      setError(false);
      Promise.all([obtenerEstadisticasApi(), obtenerEstadisticasDashboardApi()])
        .then(([r, d]) => {
          if (!activo) return;
          setResumen(r);
          setData(d);
        })
        .catch(() => activo && setError(true))
        .finally(() => activo && setCargando(false));
      return () => {
        activo = false;
      };
    }, []),
  );

  if (cargando) {
    return (
      <Screen title="Estadísticas" subtitle="Panel analítico" scrollable>
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 24 }} />
      </Screen>
    );
  }

  if (error || !data || !resumen) {
    return (
      <Screen title="Estadísticas" subtitle="Panel analítico" scrollable>
        <Text style={styles.vacio}>
          No se pudieron cargar las estadísticas.
        </Text>
      </Screen>
    );
  }

  const ventasPorDiaConDatos =
    data.ventasPorDia.filter((p) => p.cantidad > 0).length >= 2;
  const ventasPorMesConDatos = data.ventasPorMes.length >= 2;
  const ventasPorDiaSemanaConDatos = data.ventasPorDiaSemana.some(
    (p) => p.cantidad > 0,
  );

  const tortaProductos = aTorta(
    data.topProductosVendidos.map((p) => ({
      nombre: p.descripcion,
      valor: p.importe,
    })),
  );
  const tortaMetodosPago = aTorta(
    data.metodosPago.map((m) => ({ nombre: m.metodo, valor: m.total })),
  );
  const tortaPedidosEstado = aTorta(
    data.pedidosPorEstado.map((p) => ({ nombre: p.estado, valor: p.cantidad })),
  );
  const productoEstrella = data.topProductosVendidos[0];

  return (
    <Screen
      title="Estadísticas"
      subtitle="Panel analítico del negocio"
      scrollable
    >
      <View style={styles.grid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Ventas hoy</Text>
          <Text style={styles.kpiValor}>
            ${resumen.ventasHoy.total.toFixed(2)}
          </Text>
          <Text style={styles.kpiSub}>{resumen.ventasHoy.cantidad} ventas</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Ventas del mes</Text>
          <Text style={styles.kpiValor}>
            ${resumen.ventasMes.total.toFixed(2)}
          </Text>
          {data.kpis.variacionMesPct !== null ? (
            <Text
              style={[
                styles.kpiSub,
                data.kpis.variacionMesPct >= 0
                  ? styles.kpiSubPositivo
                  : styles.kpiSubNegativo,
              ]}
            >
              {data.kpis.variacionMesPct >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(data.kpis.variacionMesPct).toFixed(1)}% vs mes anterior
            </Text>
          ) : (
            <Text style={styles.kpiSub}>
              {resumen.ventasMes.cantidad} ventas
            </Text>
          )}
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Stock disponible</Text>
          <Text style={styles.kpiValor}>
            {resumen.stock.kilos.toFixed(0)} kg
          </Text>
          <Text style={styles.kpiSub}>{resumen.stock.reses} ítems</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Por cobrar</Text>
          <Text
            style={[
              styles.kpiValor,
              resumen.porCobrar.total > 0 && styles.kpiValorAlerta,
            ]}
          >
            ${resumen.porCobrar.total.toFixed(2)}
          </Text>
          <Text style={styles.kpiSub}>
            {resumen.porCobrar.clientes} clientes deudores
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Ticket promedio</Text>
          <Text style={styles.kpiValor}>
            ${data.kpis.ticketPromedio.toFixed(2)}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Kilos vendidos (mes)</Text>
          <Text style={styles.kpiValor}>
            {data.kpis.kilosVendidosMes.toFixed(0)} kg
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Clientes activos (mes)</Text>
          <Text style={styles.kpiValor}>{data.kpis.clientesActivosMes}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Ventas histórico</Text>
          <Text style={styles.kpiValor}>
            ${data.kpis.ventasTotalHistorico.toFixed(0)}
          </Text>
        </View>
      </View>

      {productoEstrella ? (
        <View style={styles.destacado}>
          <Text style={styles.destacadoLabel}>Producto más vendido</Text>
          <Text style={styles.destacadoValor}>
            {productoEstrella.descripcion}
          </Text>
          <Text style={styles.destacadoSub}>
            ${productoEstrella.importe.toFixed(0)} ·{" "}
            {productoEstrella.kilos.toFixed(0)} kg · {productoEstrella.piezas}{" "}
            ventas
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.seccion}>Ventas — últimos 30 días</Text>
        {ventasPorDiaConDatos ? (
          <LineChart
            data={{
              labels: data.ventasPorDia
                .map((p) => formatoDiaCorto(p.fecha))
                .filter((_, i) => i % 4 === 0),
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
          <Text style={styles.statSub}>
            Todavía no hay suficientes datos de ventas diarias.
          </Text>
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
          <Text style={styles.statSub}>
            Todavía no hay suficientes datos mensuales.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.seccion}>
          Ventas por día de la semana (90 días)
        </Text>
        {ventasPorDiaSemanaConDatos ? (
          <BarChart
            data={{
              labels: DIAS_SEMANA,
              datasets: [
                {
                  data: DIAS_SEMANA.map(
                    (_, i) =>
                      data.ventasPorDiaSemana.find((p) => p.diaSemana === i + 1)
                        ?.total ?? 0,
                  ),
                },
              ],
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
          <Text style={styles.statSub}>
            Todavía no hay suficientes datos por día de la semana.
          </Text>
        )}
      </View>

      {tortaProductos.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>
            Productos más vendidos (por importe)
          </Text>
          <PieChart
            data={tortaProductos}
            width={ANCHO_GRAFICO}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="8"
          />
        </View>
      ) : null}

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

      {tortaMetodosPago.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Pagos por método</Text>
          <PieChart
            data={tortaMetodosPago}
            width={ANCHO_GRAFICO}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="8"
          />
        </View>
      ) : null}

      {tortaPedidosEstado.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Pedidos por estado</Text>
          <PieChart
            data={tortaPedidosEstado}
            width={ANCHO_GRAFICO}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="8"
          />
        </View>
      ) : null}

      {resumen.topDeudores.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Top deudores</Text>
          {resumen.topDeudores.map((d) => (
            <Pressable
              key={d.id}
              style={styles.fila}
              onPress={() => router.push(`/(admin)/clientes/${d.id}`)}
            >
              <Text style={styles.filaTexto}>{d.nombre}</Text>
              <Text style={styles.filaImporte}>${d.saldo.toFixed(2)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {data.topClientes.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Top 10 clientes (histórico)</Text>
          {data.topClientes.map((c, i) => (
            <View key={c.id} style={styles.fila}>
              <Text style={styles.filaTexto}>
                {i + 1}. {c.nombre}{" "}
                <Text style={styles.filaSub}>({c.cantidad} compras)</Text>
              </Text>
              <Text style={styles.filaImporte}>${c.total.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.topProductosVendidos.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Más vendidos (detalle)</Text>
          {data.topProductosVendidos.map((p, i) => (
            <View key={p.descripcion + i} style={styles.fila}>
              <Text style={styles.filaTexto}>
                {p.descripcion}{" "}
                <Text style={styles.filaSub}>
                  ({p.kilos.toFixed(0)} kg · {p.piezas} u.)
                </Text>
              </Text>
              <Text style={styles.filaImporte}>${p.importe.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.stockPorProducto.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>
            Stock de productos (sin código de barras)
          </Text>
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

      {resumen.actividadReciente.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Actividad reciente</Text>
          {resumen.actividadReciente.map((a, i) => (
            <View key={i} style={styles.fila}>
              <Text style={styles.filaTexto}>
                {a.tipo === "venta" ? "Venta a " : "Pago de "}
                {a.clienteNombre}
              </Text>
              <Text style={styles.filaImporte}>${a.monto.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.seccion}>Repartos de hoy</Text>
        {resumen.entregasHoy.length === 0 ? (
          <Text style={styles.statSub}>
            Todavía no se entregó mercadería hoy.
          </Text>
        ) : (
          resumen.entregasHoy.map((e) => (
            <Pressable
              key={e.clienteId}
              style={styles.fila}
              onPress={() => router.push(`/(admin)/clientes/${e.clienteId}`)}
            >
              <Text style={styles.filaTexto}>
                {e.clienteNombre} · {e.repartidores}
              </Text>
              <Text style={styles.filaImporte}>{e.piezas} piezas</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.seccion}>Quién debe por lo de hoy</Text>
        {resumen.ventasHoyPorCliente.length === 0 ? (
          <Text style={styles.statSub}>
            Todavía no se registraron ventas hoy.
          </Text>
        ) : (
          resumen.ventasHoyPorCliente.map((v) => (
            <Pressable
              key={v.clienteId}
              style={styles.fila}
              onPress={() => router.push(`/(admin)/clientes/${v.clienteId}`)}
            >
              <Text style={styles.filaTexto}>{v.clienteNombre}</Text>
              <Text style={styles.filaImporte}>${v.monto.toFixed(2)}</Text>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  vacio: {
    fontFamily: "Poppins_400Regular",
    color: COLORS.grisSecundario,
    marginTop: 20,
    textAlign: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  kpiLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  kpiValor: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: COLORS.doradoOscuro,
  },
  kpiValorAlerta: { color: COLORS.error },
  kpiSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  kpiSubPositivo: { color: COLORS.exito, fontFamily: "Poppins_600SemiBold" },
  kpiSubNegativo: { color: COLORS.error, fontFamily: "Poppins_600SemiBold" },
  destacado: {
    backgroundColor: COLORS.negro,
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.dorado,
  },
  destacadoLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.doradoClaro,
  },
  destacadoValor: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: COLORS.dorado,
  },
  destacadoSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 8 },
  seccion: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
  },
  chart: { borderRadius: 12, marginLeft: -16 },
  statSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grisClaro,
    gap: 8,
  },
  filaTexto: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.grisTexto,
    flexShrink: 1,
  },
  filaSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.grisSecundario,
  },
  filaImporte: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.doradoOscuro,
  },
});
