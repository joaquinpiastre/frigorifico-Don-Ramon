import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';
import type { UnidadLive } from '@/types';

const SAN_RAFAEL = { latitude: -34.6177, longitude: -68.3301 };

interface Props {
  unidades: UnidadLive[];
}

export function LiveMap({ unidades }: Props) {
  const centro = unidades[0]
    ? { latitude: unidades[0].posicion.lat, longitude: unidades[0].posicion.lng }
    : SAN_RAFAEL;

  return (
    <MapView
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
          pinColor={COLORS.negro}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
