import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { COLORS } from '@/constants/colors';
import type { UnidadLive } from '@/types';

const SAN_RAFAEL: [number, number] = [-34.6177, -68.3301];

interface Props {
  unidades: UnidadLive[];
}

// Leaflet calcula el tamaño del mapa al montarse; si el layout de alrededor
// todavía no terminó de acomodarse (típico en React Native Web), el cálculo
// queda mal y los tiles se ven cortados/desalineados. Un ResizeObserver sobre
// el propio contenedor fuerza a Leaflet a recalcular cada vez que cambia.
function FixSize() {
  const map = useMap();
  useEffect(() => {
    const contenedor = map.getContainer();
    map.invalidateSize();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(contenedor);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function Recentrar({ unidades }: Props) {
  const map = useMap();
  useEffect(() => {
    if (unidades.length > 0) {
      map.setView([unidades[0].posicion.lat, unidades[0].posicion.lng]);
    }
  }, [unidades, map]);
  return null;
}

export function LiveMap({ unidades }: Props) {
  return (
    <MapContainer center={SAN_RAFAEL} zoom={12} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FixSize />
      <Recentrar unidades={unidades} />
      {unidades.map((u) => (
        <CircleMarker
          key={u.id}
          center={[u.posicion.lat, u.posicion.lng]}
          radius={10}
          pathOptions={{ color: COLORS.negro, fillColor: COLORS.dorado, fillOpacity: 1 }}
        >
          <Popup>{u.nombre}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
