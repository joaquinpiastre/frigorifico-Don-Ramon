import pg from 'pg';

const { Client } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Falta DATABASE_URL');
  }

  const [, , idArg, nombreArg, pinArg] = process.argv;
  const id = (idArg ?? 'admin').toLowerCase().trim();
  const nombre = nombreArg ?? 'Administrador';
  const pin = pinArg ?? '0000';

  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new Error('El PIN debe ser de 4 dígitos. Uso: node scripts/seed-admin.mjs <usuario> <nombre> <pin>');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const existente = await client.query('select id from usuarios where id = $1', [id]);
    if (existente.rowCount > 0) {
      await client.query('update usuarios set nombre = $2, pin = $3, rol = $4, activo = true where id = $1', [
        id,
        nombre,
        pin,
        'admin',
      ]);
      console.log(`Usuario "${id}" ya existía: actualizado a admin con el nuevo PIN.`);
    } else {
      await client.query(
        'insert into usuarios (id, nombre, pin, rol, activo) values ($1, $2, $3, $4, true)',
        [id, nombre, pin, 'admin']
      );
      console.log(`Usuario admin "${id}" creado correctamente.`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
