import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { eliminarResApi } from "@/services/stockApi";
import { showAlert, showConfirm } from "@/utils/alert";
import { TIPO_RES_LABEL, type Res } from "@/types";

interface Props {
  res: Res;
  onEliminado: () => void;
}

export function ResCard({ res, onEliminado }: Props) {
  const [eliminando, setEliminando] = useState(false);

  const eliminar = async () => {
    const confirmado = await showConfirm(
      "Eliminar del stock",
      `Cor ${res.cor}${res.garron ? ` · Garrón ${res.garron}` : ""}. Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;
    setEliminando(true);
    try {
      await eliminarResApi(res.id);
      onEliminado();
    } catch (e) {
      showAlert(
        "Eliminar",
        e instanceof Error ? e.message : "No se pudo eliminar.",
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.cardTexto}
        onPress={() => router.push(`/(admin)/stock/${res.id}`)}
      >
        <Text style={styles.tipo}>{TIPO_RES_LABEL[res.tipo]}</Text>
        <Text style={styles.detalle}>
          Cor {res.cor}
          {res.garron ? ` · Garrón ${res.garron}` : ""}
          {res.clasificacion ? ` · ${res.clasificacion}` : ""}
        </Text>
        <Text style={styles.kilos}>
          {res.kilosDisponibles} kg disponibles de {res.kilosIngreso} kg
        </Text>
      </Pressable>
      <Pressable
        style={styles.eliminarBtn}
        onPress={() => void eliminar()}
        disabled={eliminando}
        hitSlop={8}
      >
        {eliminando ? (
          <ActivityIndicator size="small" color={COLORS.error} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTexto: { flex: 1, gap: 4 },
  tipo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
  },
  detalle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  kilos: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.doradoOscuro,
  },
  eliminarBtn: { padding: 6 },
});
