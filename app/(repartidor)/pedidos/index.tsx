import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { showAlert } from "@/utils/alert";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  entregarPedidoApi,
  listarPedidosApi,
  obtenerPedidoApi,
} from "@/services/pedidosApi";
import { useAppStore } from "@/store/useAppStore";
import type { PedidoDetalle } from "@/types";

export default function MisPedidos() {
  const usuario = useAppStore((s) => s.usuario);
  const [pedidos, setPedidos] = useState<PedidoDetalle[]>([]);
  const [entregandoId, setEntregandoId] = useState<number | null>(null);

  const cargar = useCallback(() => {
    if (!usuario) return;
    listarPedidosApi({ estado: "cargado", repartidor: usuario.id })
      .then((lista) => Promise.all(lista.map((p) => obtenerPedidoApi(p.id))))
      .then(setPedidos)
      .catch(() => setPedidos([]));
  }, [usuario]);

  useFocusEffect(cargar);

  const marcarEntregado = async (pedido: PedidoDetalle) => {
    setEntregandoId(pedido.id);
    try {
      await entregarPedidoApi(pedido.id);
      cargar();
    } catch (e) {
      showAlert(
        "Pedido",
        e instanceof Error ? e.message : "No se pudo marcar como entregado.",
      );
    } finally {
      setEntregandoId(null);
    }
  };

  return (
    <Screen title="Mis pedidos" subtitle="Cargados en la camioneta" scrollable>
      {pedidos.length === 0 ? (
        <Text style={styles.vacio}>No tenés pedidos cargados todavía.</Text>
      ) : null}

      {pedidos.map((p) => {
        const total = p.items.reduce(
          (acc, i) => acc + i.cantidad * i.precio,
          0,
        );
        return (
          <View key={p.id} style={styles.card}>
            {/* Encabezado cliente */}
            <View style={styles.encabezado}>
              <View style={styles.encabezadoTextos}>
                <Text style={styles.cliente}>{p.clienteNombre}</Text>
                {p.clienteNumero ? (
                  <Text style={styles.clienteSub}>
                    Cliente #{p.clienteNumero}
                  </Text>
                ) : null}
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>
                  {p.items.length} ítem{p.items.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {/* Dirección y teléfono */}
            {p.clienteDireccion || p.clienteTelefono ? (
              <View style={styles.contactoRow}>
                {p.clienteDireccion ? (
                  <Text style={styles.contacto}>📍 {p.clienteDireccion}</Text>
                ) : null}
                {p.clienteTelefono ? (
                  <Text style={styles.contacto}>📞 {p.clienteTelefono}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.separador} />

            {/* Líneas del pedido */}
            {p.items.map((item) => (
              <View key={item.id} style={styles.itemFila}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemProducto}>{item.productoNombre}</Text>
                  <Text style={styles.itemImporte}>
                    ${(item.cantidad * item.precio).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemDetalle}>
                  {item.cantidad} kg × ${item.precio}/kg
                </Text>
                {item.cor || item.garron || item.tropa ? (
                  <Text style={styles.itemSub}>
                    {item.cor ? `Cor ${item.cor}` : ""}
                    {item.garron ? ` · Garrón ${item.garron}` : ""}
                    {item.tropa ? ` · Tropa ${item.tropa}` : ""}
                  </Text>
                ) : null}
                {item.nota ? (
                  <Text style={styles.itemNota}>📝 {item.nota}</Text>
                ) : null}
              </View>
            ))}

            <View style={styles.separador} />

            {/* Total y acciones */}
            <View style={styles.footer}>
              <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
            </View>

            <Button
              label="MARCAR ENTREGADO"
              loading={entregandoId === p.id}
              onPress={() => void marcarEntregado(p)}
            />
            <Button
              label="Ver detalle completo"
              variant="secondary"
              onPress={() => router.push(`/(repartidor)/pedidos/${p.id}`)}
            />
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  vacio: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.grisSecundario,
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  encabezadoTextos: { flex: 1, gap: 2 },
  cliente: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: COLORS.grisTexto,
  },
  clienteSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  badge: {
    backgroundColor: COLORS.doradoClaro,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: COLORS.doradoOscuro,
  },
  contactoRow: { gap: 2 },
  contacto: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  separador: {
    height: 1,
    backgroundColor: COLORS.grisClaro,
    marginVertical: 2,
  },
  itemFila: { gap: 2, paddingVertical: 4 },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemProducto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
    flex: 1,
  },
  itemImporte: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: COLORS.doradoOscuro,
  },
  itemDetalle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
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
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  total: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
  },
});
