import { Pool, types } from 'pg';
import { config } from '../config.js';

// El driver `pg` devuelve columnas numeric/decimal e int8/bigint como string por defecto
// (para no perder precisión). La app los usa siempre como números (ids, toFixed, sumas, etc.),
// así que los parseamos a número acá una sola vez. Los ids de esta app nunca se acercan al
// límite de Number.MAX_SAFE_INTEGER, así que la pérdida de precisión teórica del bigint no aplica.
const NUMERIC_OID = 1700;
const INT8_OID = 20;
types.setTypeParser(NUMERIC_OID, (value: string) => (value === null ? null : parseFloat(value)));
types.setTypeParser(INT8_OID, (value: string) => (value === null ? null : parseInt(value, 10)));

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes('railway') ? { rejectUnauthorized: false } : undefined,
});
