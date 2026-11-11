// Applies db/migrations/*.sql in name order, once each, inside a transaction per file.
// Usage: pnpm db:migrate   (reads DATABASE_URL_UNPOOLED, falling back to DATABASE_URL, from .env.local)
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set (see .env.local).");
  process.exit(1);
}

const dir = join(process.cwd(), "db", "migrations");
const pool = new Pool({ connectionString: url });

try {
  await pool.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const { rows } = await pool.query("select name from schema_migrations");
  const done = new Set(rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`applied ${file}`);
      applied++;
    } catch (err) {
      await client.query("rollback");
      throw new Error(`${file}: ${err.message}`);
    } finally {
      client.release();
    }
  }
  console.log(applied ? `${applied} migration(s) applied` : "database is up to date");
} finally {
  await pool.end();
}
