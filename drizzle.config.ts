import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: ["./db/schema.ts", "./examples/d1/db/schema.ts"],
  dialect: "postgresql",
});
