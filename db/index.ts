import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

function withoutTlsOptions(databaseUrl: string) {
  const url = new URL(databaseUrl);
  for (const option of ["sslmode", "ssl", "sslrootcert", "sslcert", "sslkey", "sslpassword", "sslcrl"]) {
    url.searchParams.delete(option);
  }
  return url.toString();
}

function getClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the Aurora PostgreSQL connection");
  }
  client ??= postgres(withoutTlsOptions(databaseUrl), { max: 5 });
  return client;
}

export function getDb() {
  return drizzle(getClient(), { schema });
}
