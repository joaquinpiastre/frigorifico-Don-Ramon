import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { showAlert } from "@/utils/alert";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  armarPedidoApi,
  listarPedidosApi,
  obtenerPedidoApi,
  repesarItemApi,
} from "@/services/pedidosApi";
import type { PedidoDetalle } from "@/types";

export default function PedidosParaArmar() {
  const [pedidos, setPedidos] = useState<PedidoDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [armandoId, setArmandoId] = useState<number | null>(null);
  // itemId → peso real ingresado por el operador (repesaje)
  const [repesajes, setRepesajes] = useState<Record<number, string>>({});

  const cargar = useCallback(() => {
    setCargando(true);
    listarPedidosApi({ estado: "pendiente" })
      .then((lista) => Promise.all(lista.map((p) => obtenerPedidoApi(p.id))))
      .then((detallados) => {
        setPedidos(detallados);
        // Pre-llenar repesajes con la cantidad original de cada ítem con res
        const init: Record<number, string> = {};
        for (const p of detallados) {
          for (const item of p.items) {
            if (item.resId) init[item.id] = String(item.cantidad);
          }
        }
        setRepesajes(init);
      })
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));
  }, []);

  useFocusEffect(cargar);

  const marcarArmado = async (pedido: PedidoDetalle) => {
    setArmandoId(pedido.id);
    try {
      // Aplicar repesajes que difieren de la cantidad original
      for (const item of pedido.items) {
        if (!item.resId) continue;
        const pesoReal = Number(
          (repesajes[item.id] ?? "").replace(",", "."),
        );
        if (pesoReal > 0 && pesoReal !== item.cantidad) {
          await repesarItemApi(pedido.id, item.id, pesoReal);
        }
      }
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
      <Button
        label="CREAR NUEVO PEDIDO"
        onPress={() => router.push("/(operador)/pedidos/nuevo")}
      />

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
                    {item.productoNombre} · ${item.precio}/kg
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

                  {item.resId ? (
                    <View style={styles.repesajeRow}>
                      <Text style={styles.repesajeLabel}>Peso real (kg):</Text>
                      <TextInput
                        style={styles.repesajeInput}
                        value={repesajes[item.id] ?? String(item.cantidad)}
                        onChangeText={(v) =>
                          setRepesajes((prev) => ({ ...prev, [item.id]: v }))
                        }
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                      />
                      <Text style={styles.itemSub}>
                        (pedido: {item.cantidad} kg)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.itemSub}>
                      Cantidad: {item.cantidad} kg
                    </Text>
                  )}
                </View>
              ))}
            </View>
            <Text style={styles.total}>Total pedido: ${total.toFixed(2)}</Text>
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
    marginTop: 8,
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
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.grisClaro,
    gap: 3,
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
  repesajeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  repesajeLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.grisTexto,
  },
  repesajeInput: {
    borderWidth: 1,
    borderColor: COLORS.doradoOscuro,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
    minWidth: 72,
    textAlign: "center",
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
