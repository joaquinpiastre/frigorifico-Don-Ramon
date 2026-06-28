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

-- Stock de reses, clientes, ventas y remitos.

CREATE TABLE IF NOT EXISTS clientes (
  id BIGSERIAL PRIMARY KEY,
  numero_cliente TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  razon_social TEXT,
  cuit TEXT,
  condicion_iva TEXT,
  telefono TEXT,
  direccion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Por si la tabla ya existía de una corrida anterior del esquema.
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cuit TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS condicion_iva TEXT;

-- Cabecera de una tropa/romaneo (Nro. Tropa, DTe, fecha de faena, etc.).
CREATE TABLE IF NOT EXISTS lotes_ingreso (
  id BIGSERIAL PRIMARY KEY,
  numero_tropa TEXT NOT NULL,
  dte TEXT,
  fecha_faena DATE,
  establecimiento TEXT,
  kilos_vivos_total NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Una res entera, identificada por el código de barras ("Cor") de su etiqueta ya impresa.
CREATE TABLE IF NOT EXISTS reses (
  id BIGSERIAL PRIMARY KEY,
  lote_id BIGINT NOT NULL REFERENCES lotes_ingreso(id),
  cor TEXT NOT NULL UNIQUE,
  garron TEXT,
  clasificacion TEXT,
  kilos_ingreso NUMERIC NOT NULL,
  kilos_disponibles NUMERIC NOT NULL,
  estado TEXT NOT NULL DEFAULT 'en_stock',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Por si la tabla ya existía con los nombres de campo anteriores.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reses' AND column_name = 'codigo_caravana') THEN
    ALTER TABLE reses RENAME COLUMN codigo_caravana TO cor;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reses' AND column_name = 'gar') THEN
    ALTER TABLE reses RENAME COLUMN gar TO garron;
  END IF;
END $$;
ALTER TABLE reses DROP COLUMN IF EXISTS tipificacion;
ALTER TABLE reses ALTER COLUMN garron DROP NOT NULL;

-- DEPRECATED: reemplazado por pedidos/pedido_items. No usar en código nuevo.
CREATE TABLE IF NOT EXISTS cargas_reparto (
  id BIGSERIAL PRIMARY KEY,
  repartidor TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  cerrada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEPRECATED: reemplazado por pedidos/pedido_items. No usar en código nuevo.
CREATE TABLE IF NOT EXISTS carga_items (
  id BIGSERIAL PRIMARY KEY,
  carga_id BIGINT NOT NULL REFERENCES cargas_reparto(id) ON DELETE CASCADE,
  res_id BIGINT NOT NULL REFERENCES reses(id),
  escaneado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carga_items_carga ON carga_items (carga_id);

CREATE TABLE IF NOT EXISTS ventas (
  id BIGSERIAL PRIMARY KEY,
  numero_remito BIGSERIAL NOT NULL,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_importe NUMERIC NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venta_items (
  id BIGSERIAL PRIMARY KEY,
  venta_id BIGINT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  res_id BIGINT NOT NULL REFERENCES reses(id),
  descripcion TEXT NOT NULL,
  kilos NUMERIC NOT NULL,
  precio_kg NUMERIC NOT NULL,
  importe NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS pagos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id),
  venta_id BIGINT REFERENCES ventas(id),
  monto NUMERIC NOT NULL,
  metodo TEXT,
  dias_cheque INTEGER,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Por si la tabla ya existía de una corrida anterior del esquema.
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS dias_cheque INTEGER;

CREATE INDEX IF NOT EXISTS idx_reses_estado ON reses (estado);
CREATE INDEX IF NOT EXISTS idx_venta_items_venta ON venta_items (venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_res ON venta_items (res_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos (cliente_id);

-- Catálogo de productos. Las reses (vacuno/cerdo, con código de barras "Cor") siguen
-- modeladas en la tabla reses; el resto de productos (embutidos, chorizos, morcillas,
-- etc, sin código de barras) usan este catálogo + items_stock.
CREATE TABLE IF NOT EXISTS productos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tiene_codigo_barra BOOLEAN NOT NULL DEFAULT false,
  unidad TEXT NOT NULL DEFAULT 'kg',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (nombre);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);

-- Ingreso de stock de productos SIN código de barras, registrado por el operador
-- (buscar producto manual + cantidad + guardar). Para vacuno/cerdo con barcode, el
-- ingreso sigue siendo una fila en "reses".
CREATE TABLE IF NOT EXISTS items_stock (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT NOT NULL REFERENCES productos(id),
  cantidad NUMERIC NOT NULL,
  cantidad_disponible NUMERIC NOT NULL,
  registrado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_stock_producto ON items_stock (producto_id);

-- Cabecera de un pedido armado por el admin para un cliente, asignado a un repartidor.
CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id),
  repartidor TEXT NOT NULL REFERENCES usuarios(id),
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_by TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  armado_en TIMESTAMPTZ,
  cargado_en TIMESTAMPTZ,
  entregado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_repartidor ON pedidos (repartidor);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos (cliente_id);

-- Líneas del pedido: producto + cantidad + precio + trazabilidad (garrón/tropa).
-- res_id opcional: si se vincula a una res física concreta, se completa; si no, null.
CREATE TABLE IF NOT EXISTS pedido_items (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id BIGINT NOT NULL REFERENCES productos(id),
  res_id BIGINT REFERENCES reses(id),
  cantidad NUMERIC NOT NULL,
  precio NUMERIC NOT NULL,
  garron TEXT,
  tropa TEXT,
  entregado BOOLEAN NOT NULL DEFAULT false,
  entregado_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto ON pedido_items (producto_id);
