import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { COLORS } from '@/constants/colors';
import type { UnidadLive } from '@/types';

const SAN_RAFAEL: [number, number] = [-34.6177, -68.3301];

// El export web en modo SPA ("single") no usa app/+html.tsx, así que el <link>
// a leaflet.css de ahí nunca llega al HTML final. Sin ese CSS, Leaflet no puede
// posicionar los tiles correctamente y el mapa se ve roto. Lo inyectamos a mano.
const LEAFLET_CSS_HREF = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
function asegurarLeafletCss() {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[href="${LEAFLET_CSS_HREF}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = LEAFLET_CSS_HREF;
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
}

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

const ZOOM_CON_CAMION = 16;

function Recentrar({ unidades }: Props) {
  const map = useMap();
  useEffect(() => {
    if (unidades.length > 0) {
      map.setView([unidades[0].posicion.lat, unidades[0].posicion.lng], ZOOM_CON_CAMION);
    }
  }, [unidades, map]);
  return null;
}

export function LiveMap({ unidades }: Props) {
  asegurarLeafletCss();
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
