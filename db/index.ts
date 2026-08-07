import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

function getClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the Aurora PostgreSQL connection");
  }
  client ??= postgres(databaseUrl, { max: 10 });
  return client;
}

export function getDb() {
  return drizzle(getClient(), { schema });
}
