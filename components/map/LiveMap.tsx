import { useEffect, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import type { UnidadLive } from "@/types";

const SAN_RAFAEL = { latitude: -34.6177, longitude: -68.3301 };
const DELTA_CON_CAMION = 0.01;

interface Props {
  unidades: UnidadLive[];
  seleccionadoId?: string | null;
}

export function LiveMap({ unidades, seleccionadoId }: Props) {
  const mapRef = useRef<MapView>(null);
  const yaCentradoInicial = useRef(false);

  const centro = unidades[0]
    ? {
        latitude: unidades[0].posicion.lat,
        longitude: unidades[0].posicion.lng,
      }
    : SAN_RAFAEL;

  useEffect(() => {
    if (!seleccionadoId) return;
    const objetivo = unidades.find((u) => u.id === seleccionadoId);
    if (objetivo) {
      mapRef.current?.animateToRegion(
        {
          latitude: objetivo.posicion.lat,
          longitude: objetivo.posicion.lng,
          latitudeDelta: DELTA_CON_CAMION,
          longitudeDelta: DELTA_CON_CAMION,
        },
        500,
      );
    }
  }, [seleccionadoId]);

  useEffect(() => {
    if (seleccionadoId || unidades.length === 0) return;
    if (!yaCentradoInicial.current) {
      yaCentradoInicial.current = true;
      return;
    }
    if (unidades.length === 1) {
      mapRef.current?.animateToRegion(
        {
          latitude: unidades[0].posicion.lat,
          longitude: unidades[0].posicion.lng,
          latitudeDelta: DELTA_CON_CAMION,
          longitudeDelta: DELTA_CON_CAMION,
        },
        500,
      );
      return;
    }
    mapRef.current?.fitToCoordinates(
      unidades.map((u) => ({
        latitude: u.posicion.lat,
        longitude: u.posicion.lng,
      })),
      {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      },
    );
    // Solo cuando se vuelve a "null" explícitamente, no en cada poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionadoId]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        ...centro,
        latitudeDelta: 0.4,
        longitudeDelta: 0.4,
      }}
    >
      {unidades.map((u) => (
        <Marker
          key={u.id}
          coordinate={{ latitude: u.posicion.lat, longitude: u.posicion.lng }}
          title={u.nombre}
          pinColor={u.id === seleccionadoId ? COLORS.dorado : COLORS.negro}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
