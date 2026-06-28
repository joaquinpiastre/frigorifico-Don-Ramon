import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  obtenerHistorialDiaApi,
  obtenerHistorialMesApi,
} from "@/services/historialApi";
import {
  ESTADO_PEDIDO_LABEL,
  type HistorialDiaDetalle,
  type HistorialDiaResumen,
} from "@/types";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function aClaveFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function aClaveMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function HistorialIndex() {
  const hoy = useMemo(() => new Date(), []);
  const [mesVisible, setMesVisible] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );
  const [diaSeleccionado, setDiaSeleccionado] = useState(() =>
    aClaveFecha(hoy),
  );

  const [diasMes, setDiasMes] = useState<HistorialDiaResumen[]>([]);
  const [cargandoMes, setCargandoMes] = useState(true);

  const [detalle, setDetalle] = useState<HistorialDiaDetalle | null>(null);
  const [cargandoDia, setCargandoDia] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setCargandoMes(true);
    obtenerHistorialMesApi(aClaveMes(mesVisible))
      .then(setDiasMes)
      .catch(() => setDiasMes([]))
      .finally(() => setCargandoMes(false));
  }, [mesVisible]);

  useEffect(() => {
    setCargandoDia(true);
    setError(false);
    obtenerHistorialDiaApi(diaSeleccionado)
      .then(setDetalle)
      .catch(() => setError(true))
      .finally(() => setCargandoDia(false));
  }, [diaSeleccionado]);

  const actividadPorDia = useMemo(() => {
    const mapa = new Map<string, HistorialDiaResumen>();
    for (const d of diasMes) mapa.set(d.fecha, d);
    return mapa;
  }, [diasMes]);

  const celdas = useMemo(() => {
    const primerDia = new Date(
      mesVisible.getFullYear(),
      mesVisible.getMonth(),
      1,
    );
    const diasEnMes = new Date(
      mesVisible.getFullYear(),
      mesVisible.getMonth() + 1,
      0,
    ).getDate();
    const offset = (primerDia.getDay() + 6) % 7;
    const lista: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= diasEnMes; d++) {
      lista.push(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), d));
    }
    while (lista.length % 7 !== 0) lista.push(null);
    return lista;
  }, [mesVisible]);

  const cambiarMes = useCallback((delta: number) => {
    setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }, []);

  const claveHoy = aClaveFecha(hoy);

  return (
    <Screen
      title="Historial"
      subtitle="Calendario de actividad diaria"
      scrollable
    >
      <View style={styles.card}>
        <View style={styles.mesHeader}>
          <Pressable onPress={() => cambiarMes(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={COLORS.grisTexto} />
          </Pressable>
          <Text style={styles.mesTitulo}>
            {NOMBRES_MES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
          </Text>
          <Pressable onPress={() => cambiarMes(1)} hitSlop={10}>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={COLORS.grisTexto}
            />
          </Pressable>
        </View>

        <View style={styles.filaSemana}>
          {DIAS_SEMANA.map((d) => (
            <Text key={d} style={styles.diaSemanaTexto}>
              {d}
            </Text>
          ))}
        </View>

        {cargandoMes ? (
          <ActivityIndicator
            color={COLORS.negro}
            style={{ marginVertical: 12 }}
          />
        ) : (
          <View style={styles.grilla}>
            {celdas.map((fecha, i) => {
              if (!fecha) return <View key={i} style={styles.celda} />;
              const clave = aClaveFecha(fecha);
              const actividad = actividadPorDia.get(clave);
              const tieneActividad =
                !!actividad &&
                (actividad.cantidadVentas > 0 ||
                  actividad.cantidadPedidos > 0 ||
                  actividad.totalCobros > 0);
              const seleccionado = clave === diaSeleccionado;
              const esHoy = clave === claveHoy;
              return (
                <Pressable
                  key={i}
                  style={[
                    styles.celda,
                    seleccionado && styles.celdaSeleccionada,
                  ]}
                  onPress={() => setDiaSeleccionado(clave)}
                >
                  <Text
                    style={[
                      styles.celdaTexto,
                      esHoy && styles.celdaTextoHoy,
                      seleccionado && styles.celdaTextoSeleccionado,
                    ]}
                  >
                    {fecha.getDate()}
                  </Text>
                  {tieneActividad ? (
                    <View
                      style={[
                        styles.puntito,
                        seleccionado && styles.puntitoSeleccionado,
                      ]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {cargandoDia ? (
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 20 }} />
      ) : error || !detalle ? (
        <Text style={styles.vacio}>
          No se pudo cargar la información de ese día.
        </Text>
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Ventas (mercadería)</Text>
              <Text style={styles.kpiValor}>
                ${detalle.resumen.totalVentas.toFixed(2)}
              </Text>
              <Text style={styles.kpiSub}>
                {detalle.resumen.cantidadVentas} ventas
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Dinero que ingresó</Text>
              <Text style={styles.kpiValor}>
                ${detalle.resumen.totalCobros.toFixed(2)}
              </Text>
              <Text style={styles.kpiSub}>
                {detalle.resumen.cantidadPagos} cobros
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Kilos vendidos</Text>
              <Text style={styles.kpiValor}>
                {detalle.resumen.kilosVendidos.toFixed(0)} kg
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Pedidos del día</Text>
              <Text style={styles.kpiValor}>
                {detalle.resumen.cantidadPedidos}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.seccion}>Pedidos</Text>
            {detalle.pedidos.length === 0 ? (
              <Text style={styles.statSub}>
                No se registraron pedidos este día.
              </Text>
            ) : (
              detalle.pedidos.map((p) => (
                <View key={p.id} style={styles.fila}>
                  <Text style={styles.filaTexto}>
                    {p.clienteNombre}{" "}
                    <Text style={styles.filaSub}>· {p.repartidorNombre}</Text>
                  </Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.filaImporte}>
                      ${p.total.toFixed(0)}
                    </Text>
                    <Text style={styles.filaSub}>
                      {ESTADO_PEDIDO_LABEL[p.estado]}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.seccion}>Ventas</Text>
            {detalle.ventas.length === 0 ? (
              <Text style={styles.statSub}>
                No se registraron ventas este día.
              </Text>
            ) : (
              detalle.ventas.map((v) => (
                <Pressable
                  key={v.id}
                  style={styles.fila}
                  onPress={() => router.push(`/(admin)/ventas/${v.id}/remito`)}
                >
                  <Text style={styles.filaTexto}>
                    Remito N° {v.numeroRemito} · {v.clienteNombre}
                  </Text>
                  <Text style={styles.filaImporte}>
                    ${v.totalImporte.toFixed(2)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.seccion}>Mercadería vendida</Text>
            {detalle.productosVendidos.length === 0 ? (
              <Text style={styles.statSub}>
                Sin mercadería vendida este día.
              </Text>
            ) : (
              detalle.productosVendidos.map((p, i) => (
                <View key={p.descripcion + i} style={styles.fila}>
                  <Text style={styles.filaTexto}>
                    {p.descripcion}{" "}
                    <Text style={styles.filaSub}>
                      ({p.kilos.toFixed(0)} kg · {p.piezas} u.)
                    </Text>
                  </Text>
                  <Text style={styles.filaImporte}>
                    ${p.importe.toFixed(0)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.seccion}>Cobros por método</Text>
            {detalle.pagos.length === 0 ? (
              <Text style={styles.statSub}>
                No se recibieron pagos este día.
              </Text>
            ) : (
              detalle.pagos.map((p, i) => (
                <View key={p.metodo + i} style={styles.fila}>
                  <Text style={styles.filaTexto}>
                    {p.metodo}{" "}
                    <Text style={styles.filaSub}>({p.cantidad})</Text>
                  </Text>
                  <Text style={styles.filaImporte}>${p.total.toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  mesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mesTitulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
  },
  filaSemana: { flexDirection: "row", marginTop: 8 },
  diaSemanaTexto: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: COLORS.grisSecundario,
  },
  grilla: { flexDirection: "row", flexWrap: "wrap" },
  celda: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  celdaSeleccionada: { backgroundColor: COLORS.negro },
  celdaTexto: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  celdaTextoHoy: { color: COLORS.doradoOscuro, fontFamily: "Poppins_700Bold" },
  celdaTextoSeleccionado: {
    color: COLORS.dorado,
    fontFamily: "Poppins_700Bold",
  },
  puntito: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.doradoOscuro,
    marginTop: 2,
  },
  puntitoSeleccionado: { backgroundColor: COLORS.dorado },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
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
  kpiSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  seccion: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
  },
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
