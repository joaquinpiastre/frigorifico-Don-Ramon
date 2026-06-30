import { useEffect, useRef } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { COLORS } from "@/constants/colors";
import type { UnidadLive } from "@/types";

const SAN_RAFAEL: [number, number] = [-34.6177, -68.3301];

// El export web en modo SPA ("single") no usa app/+html.tsx, así que el <link>
// a leaflet.css de ahí nunca llega al HTML final. Sin ese CSS, Leaflet no puede
// posicionar los tiles correctamente y el mapa se ve roto. Lo inyectamos a mano.
const LEAFLET_CSS_HREF = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
function asegurarLeafletCss() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[href="${LEAFLET_CSS_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = LEAFLET_CSS_HREF;
  link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
  link.crossOrigin = "";
  document.head.appendChild(link);
}

interface Props {
  unidades: UnidadLive[];
  seleccionadoId?: string | null;
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

function Recentrar({ unidades, seleccionadoId }: Props) {
  const map = useMap();
  const unidadesRef = useRef(unidades);
  unidadesRef.current = unidades;
  const yaCentradoInicial = useRef(false);

  // Centrado automático una sola vez al llegar la primera posición (si no hay nada elegido).
  useEffect(() => {
    if (!yaCentradoInicial.current && !seleccionadoId && unidades.length > 0) {
      yaCentradoInicial.current = true;
      map.setView(
        [unidades[0].posicion.lat, unidades[0].posicion.lng],
        ZOOM_CON_CAMION,
      );
    }
  }, [unidades, seleccionadoId, map]);

  // Zoom a la unidad elegida cada vez que cambia la selección.
  useEffect(() => {
    if (!seleccionadoId) return;
    const objetivo = unidadesRef.current.find((u) => u.id === seleccionadoId);
    if (objetivo) {
      map.setView(
        [objetivo.posicion.lat, objetivo.posicion.lng],
        ZOOM_CON_CAMION,
      );
    }
  }, [seleccionadoId, map]);

  // Al volver a "Ver todos", ajustamos la vista para que entren todas las unidades.
  useEffect(() => {
    if (seleccionadoId || unidadesRef.current.length === 0) return;
    if (unidadesRef.current.length === 1) {
      const u = unidadesRef.current[0];
      map.setView([u.posicion.lat, u.posicion.lng], ZOOM_CON_CAMION);
      return;
    }
    map.fitBounds(
      unidadesRef.current.map((u) => [u.posicion.lat, u.posicion.lng]),
      { padding: [40, 40] },
    );
    // Solo cuando vuelve a "null" explícitamente (cambia seleccionadoId), no en cada poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionadoId]);

  return null;
}

export function LiveMap({ unidades, seleccionadoId }: Props) {
  asegurarLeafletCss();
  return (
    <MapContainer
      center={SAN_RAFAEL}
      zoom={12}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FixSize />
      <Recentrar unidades={unidades} seleccionadoId={seleccionadoId} />
      {unidades.map((u) => (
        <CircleMarker
          key={u.id}
          center={[u.posicion.lat, u.posicion.lng]}
          radius={u.id === seleccionadoId ? 13 : 10}
          pathOptions={{
            color: COLORS.negro,
            fillColor:
              u.id === seleccionadoId ? COLORS.doradoClaro : COLORS.dorado,
            fillOpacity: 1,
            weight: u.id === seleccionadoId ? 3 : 1,
          }}
        >
          <Popup>{u.nombre}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
