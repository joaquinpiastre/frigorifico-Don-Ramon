import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showAlert, showConfirm } from "@/utils/alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  actualizarResApi,
  eliminarResApi,
  listarResesApi,
} from "@/services/stockApi";
import {
  TIPO_RES_LABEL,
  type EstadoRes,
  type Res,
  type TipoRes,
} from "@/types";

const ESTADOS: EstadoRes[] = ["en_stock", "agotada"];
const TIPOS: TipoRes[] = ["vacuno", "cerdo", "toro", "otro"];

export default function EditarRes() {
  const params = useLocalSearchParams<{ id: string }>();
  const resId = Number(params.id);

  const [res, setRes] = useState<Res | null>(null);
  const [cargando, setCargando] = useState(true);

  const [garron, setGarron] = useState("");
  const [tipo, setTipo] = useState<TipoRes>("vacuno");
  const [clasificacion, setClasificacion] = useState("");
  const [kilosDisponibles, setKilosDisponibles] = useState("");
  const [estado, setEstado] = useState<EstadoRes>("en_stock");
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    listarResesApi()
      .then((data) => {
        const encontrada = data.find((r) => r.id === resId) ?? null;
        setRes(encontrada);
        if (encontrada) {
          setGarron(encontrada.garron ?? "");
          setTipo(encontrada.tipo);
          setClasificacion(encontrada.clasificacion ?? "");
          setKilosDisponibles(String(encontrada.kilosDisponibles));
          setEstado(encontrada.estado);
        }
      })
      .catch(() => setRes(null))
      .finally(() => setCargando(false));
  }, [resId]);

  const guardar = async () => {
    const kilosNum = Number(kilosDisponibles.replace(",", "."));
    if (!kilosNum || kilosNum < 0) {
      showAlert("Res", "Los kilos disponibles deben ser un número válido.");
      return;
    }
    setGuardando(true);
    try {
      await actualizarResApi(resId, {
        garron: garron.trim() || undefined,
        tipo,
        clasificacion: clasificacion.trim() || undefined,
        kilosDisponibles: kilosNum,
        estado,
      });
      showAlert("Res actualizada", "Los cambios se guardaron correctamente.");
      router.back();
    } catch (e) {
      showAlert(
        "Res",
        e instanceof Error ? e.message : "No se pudo actualizar la res.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!res) return;
    const confirmado = await showConfirm(
      "Eliminar del stock",
      `Cor ${res.cor}${res.garron ? ` · Garrón ${res.garron}` : ""}. Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;
    setEliminando(true);
    try {
      await eliminarResApi(res.id);
      router.back();
    } catch (e) {
      showAlert(
        "Eliminar",
        e instanceof Error ? e.message : "No se pudo eliminar.",
      );
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) {
    return (
      <Screen title="Editar res">
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 20 }} />
      </Screen>
    );
  }

  if (!res) {
    return (
      <Screen title="Editar res">
        <Text style={styles.vacio}>No se encontró esa res.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      title={TIPO_RES_LABEL[res.tipo]}
      subtitle={`Cor ${res.cor} · Ingresada con ${res.kilosIngreso} kg`}
      scrollable
    >
      <View style={styles.card}>
        <Input label="Garrón" value={garron} onChangeText={setGarron} />
        <Text style={styles.label}>Tipo de producto</Text>
        <View style={styles.fila}>
          {TIPOS.map((t) => (
            <Pressable
              key={t}
              style={[styles.chip, tipo === t && styles.chipActivo]}
              onPress={() => setTipo(t)}
            >
              <Text
                style={[styles.chipTexto, tipo === t && styles.chipTextoActivo]}
              >
                {TIPO_RES_LABEL[t]}
              </Text>
            </Pressable>
          ))}
        </View>
        <Input
          label="Clasificación"
          value={clasificacion}
          onChangeText={setClasificacion}
          autoCapitalize="characters"
        />
        <Input
          label="Kilos disponibles"
          value={kilosDisponibles}
          onChangeText={setKilosDisponibles}
          keyboardType="decimal-pad"
        />
        <Text style={styles.label}>Estado</Text>
        <View style={styles.fila}>
          {ESTADOS.map((e) => (
            <Pressable
              key={e}
              style={[styles.chip, estado === e && styles.chipActivo]}
              onPress={() => setEstado(e)}
            >
              <Text
                style={[
                  styles.chipTexto,
                  estado === e && styles.chipTextoActivo,
                ]}
              >
                {e === "en_stock" ? "En stock" : "Agotada"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button
          label="GUARDAR CAMBIOS"
          loading={guardando}
          onPress={() => void guardar()}
        />
      </View>
      <Button
        label="ELIMINAR DEL STOCK"
        variant="danger"
        loading={eliminando}
        onPress={() => void eliminar()}
      />
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
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 4 },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
    marginBottom: 6,
  },
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dcd2c8",
  },
  chipActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  chipTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  chipTextoActivo: { color: "#fff" },
});
