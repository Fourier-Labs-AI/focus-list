import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let connection: ReturnType<typeof postgres> | undefined;
let databaseUrl: string | undefined;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to connect to Aurora PostgreSQL.");
  }

  // Read the URL when a request asks for the database, rather than while the
  // server bundle is being built. Reuse the client only within a warm runtime.
  if (!connection || databaseUrl !== url) {
    connection = postgres(url, { prepare: false });
    databaseUrl = url;
  }

  return drizzle(connection, { schema });
}
