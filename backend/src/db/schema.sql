-- Base mínima: usuarios (login) + dispositivos GPS (trackers GT06).
-- Las tablas de stock, productos, movimientos, etc. se agregan cuando se
-- defina cómo funciona esa parte de la app.

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  pin TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'operador',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entidad genérica que puede llevar un tracker (camión, jaula refrigerada, etc.)
CREATE TABLE IF NOT EXISTS unidades_rastreadas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dispositivos_gps (
  imei TEXT PRIMARY KEY,
  unidad_id TEXT NOT NULL REFERENCES unidades_rastreadas(id),
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  ultimo_contacto_ms BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gps_points (
  id BIGSERIAL PRIMARY KEY,
  unidad_id TEXT NOT NULL REFERENCES unidades_rastreadas(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  velocidad DOUBLE PRECISION,
  timestamp_ms BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gps_points_unidad_ts ON gps_points (unidad_id, timestamp_ms DESC);
