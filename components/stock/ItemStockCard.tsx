import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";
import type { ItemStock } from "@/types";

interface Props {
  item: ItemStock;
}

export function ItemStockCard({ item }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.nombre}>{item.productoNombre}</Text>
      <Text style={styles.cantidad}>
        {item.cantidadDisponible} {item.unidad} disponibles de {item.cantidad}{" "}
        {item.unidad}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 4 },
  nombre: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
  },
  cantidad: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.doradoOscuro,
  },
});
