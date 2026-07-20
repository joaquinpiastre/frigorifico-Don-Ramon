import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LiveMap } from "@/components/map/LiveMap";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import { obtenerPosicionesLiveApi } from "@/services/gpsApi";
import type { UnidadLive } from "@/types";

const INTERVALO_MS = 10_000;

function haceCuanto(timestampMs: number): string {
  const segundos = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  if (segundos < 60) return `hace ${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `hace ${horas} h`;
}

export default function MapaEnVivoRepartidor() {
  const [unidades, setUnidades] = useState<UnidadLive[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      const cargar = () => {
        obtenerPosicionesLiveApi()
          .then((data) => activo && setUnidades(data))
          .catch(() => activo && setUnidades([]))
          .finally(() => activo && setCargando(false));
      };
      cargar();
      const intervalo = setInterval(cargar, INTERVALO_MS);
      return () => {
        activo = false;
        clearInterval(intervalo);
      };
    }, []),
  );

  return (
    <Screen
      title="Mapa en vivo"
      subtitle="Posición de los camiones de reparto"
      scrollable
    >
      {unidades.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filaChips}
        >
          <Pressable
            style={[styles.chip, seleccionadoId === null && styles.chipActivo]}
            onPress={() => setSeleccionadoId(null)}
          >
            <Text
              style={[
                styles.chipTexto,
                seleccionadoId === null && styles.chipTextoActivo,
              ]}
            >
              Ver todos
            </Text>
          </Pressable>
          {unidades.map((u) => (
            <Pressable
              key={u.id}
              style={[
                styles.chip,
                seleccionadoId === u.id && styles.chipActivo,
              ]}
              onPress={() => setSeleccionadoId(u.id)}
            >
              <Text
                style={[
                  styles.chipTexto,
                  seleccionadoId === u.id && styles.chipTextoActivo,
                ]}
              >
                {u.nombre}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.mapaWrapper}>
        <LiveMap unidades={unidades} seleccionadoId={seleccionadoId} />
      </View>

      {cargando ? (
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 12 }} />
      ) : unidades.length === 0 ? (
        <Text style={styles.vacio}>
          Ningún camión reportó posición en las últimas 24 horas.
        </Text>
      ) : (
        unidades.map((u) => (
          <Pressable
            key={u.id}
            style={[styles.card, seleccionadoId === u.id && styles.cardActiva]}
            onPress={() => setSeleccionadoId(u.id)}
          >
            <Text style={styles.nombre}>{u.nombre}</Text>
            <Text style={styles.detalle}>{haceCuanto(u.actualizadoEn)}</Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapaWrapper: { borderRadius: 16, overflow: "hidden", height: 420 },
  vacio: {
    fontFamily: "Poppins_400Regular",
    color: COLORS.grisSecundario,
    marginTop: 12,
    textAlign: "center",
  },
  filaChips: { marginBottom: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dcd2c8",
    marginRight: 8,
  },
  chipActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  chipTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  chipTextoActivo: { color: COLORS.dorado },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardActiva: { borderWidth: 1.5, borderColor: COLORS.dorado },
  nombre: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
  },
  detalle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.grisSecundario,
  },
});
