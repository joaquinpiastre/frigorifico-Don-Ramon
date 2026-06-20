import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { pool } from '../db/client.js';

export const gpsRouter = Router();

const dispositivoSchema = z.object({
  imei: z.string().regex(/^\d{15}$/, 'IMEI debe ser 15 dígitos numéricos'),
  unidadId: z.string().min(1),
  unidadNombre: z.string().min(2),
  nombreTracker: z.string().min(2),
});

// GET /gps/live — última posición conocida de cada unidad (últimas 24h)
gpsRouter.get('/gps/live', requireAuth, async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  const { rows } = await pool.query<{
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    actualizadoEn: number;
  }>(
    `select distinct on (gp.unidad_id)
       gp.unidad_id as id,
       u.nombre,
       gp.lat,
       gp.lng,
       gp.timestamp_ms as "actualizadoEn"
     from gps_points gp
     join unidades_rastreadas u on u.id = gp.unidad_id
     where gp.timestamp_ms > extract(epoch from now() - interval '24 hours') * 1000
       and gp.timestamp_ms <= extract(epoch from now() + interval '5 minutes') * 1000
     order by gp.unidad_id, gp.timestamp_ms desc`
  );
  res.json({
    unidades: rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      posicion: { lat: Number(r.lat), lng: Number(r.lng) },
      actualizadoEn: Number(r.actualizadoEn),
    })),
  });
});

// GET /admin/dispositivos-gps — lista de trackers registrados
gpsRouter.get('/admin/dispositivos-gps', requireAuth, async (_req, res) => {
  const { rows } = await pool.query(
    `select d.imei, d.unidad_id as "unidadId", u.nombre as "unidadNombre", d.nombre,
            d.activo, d.ultimo_contacto_ms as "ultimoContactoMs"
     from dispositivos_gps d
     join unidades_rastreadas u on u.id = d.unidad_id
     order by d.nombre`
  );
  res.json({ dispositivos: rows });
});

// POST /admin/dispositivos-gps — registra/actualiza un tracker y su unidad
gpsRouter.post('/admin/dispositivos-gps', requireAuth, async (req, res) => {
  const parsed = dispositivoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos.', detalle: parsed.error.flatten() });
    return;
  }
  const { imei, unidadId, unidadNombre, nombreTracker } = parsed.data;

  await pool.query(
    `insert into unidades_rastreadas (id, nombre, activo)
     values ($1, $2, true)
     on conflict (id) do update set nombre = $2, activo = true`,
    [unidadId, unidadNombre]
  );
  await pool.query(
    `insert into dispositivos_gps (imei, unidad_id, nombre, activo)
     values ($1, $2, $3, true)
     on conflict (imei) do update set unidad_id = $2, nombre = $3, activo = true`,
    [imei, unidadId, nombreTracker]
  );
  res.json({ ok: true });
});

// DELETE /admin/dispositivos-gps/:imei — desactiva un tracker
gpsRouter.delete('/admin/dispositivos-gps/:imei', requireAuth, async (req, res) => {
  await pool.query(`update dispositivos_gps set activo = false where imei = $1`, [req.params.imei]);
  res.json({ ok: true });
});
