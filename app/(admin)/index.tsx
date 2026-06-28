import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import { useAppStore } from "@/store/useAppStore";

export default function AdminHome() {
  const { usuario, resetSesion } = useAppStore();
  const esAdmin = usuario?.rol === "admin";

  return (
    <Screen
      title={`Hola, ${usuario?.nombre ?? ""}`}
      subtitle="Don Ramón · Control de Stock"
      scrollable
    >
      <Button
        label="ESTADÍSTICAS"
        iconLeft={
          <Ionicons
            name="stats-chart-outline"
            size={18}
            color={COLORS.blanco}
          />
        }
        onPress={() => router.push("/(admin)/estadisticas")}
      />
      <Button
        label="STOCK DE RESES"
        variant="secondary"
        iconLeft={
          <Ionicons name="cube-outline" size={18} color={COLORS.negro} />
        }
        onPress={() => router.push("/(admin)/stock")}
      />
      <Button
        label="NUEVA VENTA"
        variant="secondary"
        iconLeft={
          <Ionicons name="receipt-outline" size={18} color={COLORS.negro} />
        }
        onPress={() => router.push("/(admin)/ventas/nueva")}
      />
      <Button
        label="CLIENTES"
        variant="secondary"
        iconLeft={
          <Ionicons name="people-outline" size={18} color={COLORS.negro} />
        }
        onPress={() => router.push("/(admin)/clientes")}
      />
      <Button
        label="PEDIDOS"
        variant="secondary"
        iconLeft={
          <Ionicons name="cart-outline" size={18} color={COLORS.negro} />
        }
        onPress={() => router.push("/(admin)/pedidos")}
      />
      {esAdmin ? (
        <>
          <Button
            label="PRODUCTOS"
            variant="secondary"
            iconLeft={
              <Ionicons
                name="pricetags-outline"
                size={18}
                color={COLORS.negro}
              />
            }
            onPress={() => router.push("/(admin)/productos")}
          />
          <Button
            label="MAPA EN VIVO"
            variant="secondary"
            iconLeft={
              <Ionicons name="map-outline" size={18} color={COLORS.negro} />
            }
            onPress={() => router.push("/(admin)/mapa")}
          />
          <Button
            label="USUARIOS"
            variant="secondary"
            iconLeft={
              <Ionicons name="key-outline" size={18} color={COLORS.negro} />
            }
            onPress={() => router.push("/(admin)/usuarios")}
          />
          <Button
            label="RASTREADORES"
            variant="secondary"
            iconLeft={
              <Ionicons
                name="navigate-outline"
                size={18}
                color={COLORS.negro}
              />
            }
            onPress={() => router.push("/(admin)/rastreadores")}
          />
        </>
      ) : null}
      <Button
        label="CERRAR SESIÓN"
        variant="danger"
        iconLeft={
          <Ionicons name="log-out-outline" size={18} color={COLORS.blanco} />
        }
        onPress={() => {
          resetSesion();
          router.replace("/(auth)/login");
        }}
      />
    </Screen>
  );
}
