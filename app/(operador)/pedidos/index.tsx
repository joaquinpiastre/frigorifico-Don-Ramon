import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { showAlert } from "@/utils/alert";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  armarPedidoApi,
  listarPedidosApi,
  obtenerPedidoApi,
} from "@/services/pedidosApi";
import type { PedidoDetalle } from "@/types";

export default function PedidosParaArmar() {
  const [pedidos, setPedidos] = useState<PedidoDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [armandoId, setArmandoId] = useState<number | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    listarPedidosApi({ estado: "pendiente" })
      .then((lista) => Promise.all(lista.map((p) => obtenerPedidoApi(p.id))))
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));
  }, []);

  useFocusEffect(cargar);

  const marcarArmado = async (pedido: PedidoDetalle) => {
    setArmandoId(pedido.id);
    try {
      await armarPedidoApi(pedido.id);
      cargar();
    } catch (e) {
      showAlert(
        "Pedido",
        e instanceof Error ? e.message : "No se pudo marcar como armado.",
      );
    } finally {
      setArmandoId(null);
    }
  };

  return (
    <Screen
      title="Pedidos para armar"
      subtitle="Separá la mercadería y marcá listo"
      scrollable
    >
      {!cargando && pedidos.length === 0 ? (
        <Text style={styles.vacio}>No hay pedidos pendientes.</Text>
      ) : null}
      {pedidos.map((p) => {
        const total = p.items.reduce(
          (acc, i) => acc + i.cantidad * i.precio,
          0,
        );
        return (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cliente}>{p.clienteNombre}</Text>
            <Text style={styles.sub}>
              Repartidor: {p.repartidorNombre ?? p.repartidor}
            </Text>
            <View style={styles.items}>
              {p.items.map((item) => (
                <View key={item.id} style={styles.itemFila}>
                  <Text style={styles.itemTexto}>
                    {item.productoNombre} · {item.cantidad} × ${item.precio} = $
                    {(item.cantidad * item.precio).toFixed(2)}
                  </Text>
                  {item.cor || item.garron || item.tropa ? (
                    <Text style={styles.itemSub}>
                      {item.cor ? `Cor ${item.cor} · ` : ""}
                      {item.garron ? `Garrón ${item.garron} · ` : ""}
                      {item.tropa ? `Tropa ${item.tropa}` : ""}
                    </Text>
                  ) : null}
                  {item.nota ? (
                    <Text style={styles.itemNota}>Nota: {item.nota}</Text>
                  ) : null}
                </View>
              ))}
            </View>
            <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
            <Button
              label="MARCAR ARMADO"
              loading={armandoId === p.id}
              onPress={() => void marcarArmado(p)}
            />
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    marginBottom: 10,
  },
  cliente: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
  },
  sub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.grisSecundario,
  },
  items: { gap: 4, marginTop: 4 },
  itemFila: {
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.grisClaro,
  },
  itemTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  itemSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.grisSecundario,
  },
  itemNota: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.advertencia,
  },
  total: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.doradoOscuro,
    textAlign: "right",
  },
  vacio: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.grisSecundario,
    textAlign: "center",
    marginTop: 20,
  },
});
