import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const marker = "/__HARBOUR_BASE_PATH__";
const textExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".txt"]);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

async function findMarker(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await findMarker(path);
      if (nested) return nested;
    } else if (textExtensions.has(extname(entry.name))) {
      const contents = await readFile(path, "utf8");
      if (contents.includes(marker)) return path;
    }
  }
  return null;
}

test("build produces the native Next server and public asset trees", async () => {
  await Promise.all([
    access(new URL("../.next/standalone/server.js", import.meta.url)),
    access(new URL("../.next/static", import.meta.url)),
    access(new URL("../.next/standalone/public", import.meta.url)),
  ]);

  const packageJson = JSON.parse(await source("package.json"));
  assert.equal(packageJson.scripts.start, "node .next/standalone/server.js");
  assert.match(packageJson.scripts.build, /^next build && node scripts\/prepare-harbour\.mjs$/);
});

test("post-build preparation rewrites the base-path marker in both deployable trees", async () => {
  const [standaloneMarker, staticMarker, prepareScript, nextConfig] = await Promise.all([
    findMarker(new URL("../.next/standalone", import.meta.url)),
    findMarker(new URL("../.next/static", import.meta.url)),
    source("scripts/prepare-harbour.mjs"),
    source("next.config.ts"),
  ]);

  assert.equal(standaloneMarker, null, `unreplaced marker in ${standaloneMarker}`);
  assert.equal(staticMarker, null, `unreplaced marker in ${staticMarker}`);
  assert.match(nextConfig, /output:\s*["']standalone["']/);
  assert.match(prepareScript, /replaceMarker\(["']\.next\/standalone["']\)/);
  assert.match(prepareScript, /replaceMarker\(["']\.next\/static["']\)/);
});

test("database access is request-runtime PostgreSQL and browser writes use the Harbour boundary", async () => {
  const [database, schema, apiRoute, page, tsconfig] = await Promise.all([
    source("db/index.ts"),
    source("db/schema.ts"),
    source("app/api/todos/route.ts"),
    source("app/page.tsx"),
    source("tsconfig.json"),
  ]);

  assert.match(database, /process\.env\.DATABASE_URL/);
  assert.match(database, /postgres\(databaseUrl/);
  assert.match(database, /drizzle\(getClient\(\)/);
  assert.match(schema, /from ["']drizzle-orm\/pg-core["']/);
  assert.match(apiRoute, /getDb\(\)/);
  assert.ok(page.includes('window.location.pathname.match(/^\\/p\\/'));
  assert.match(page, /crypto\.subtle\.digest\(["']SHA-256["']/);
  assert.match(page, /headers\.set\(["']x-amz-content-sha256["']/);

  const config = JSON.parse(tsconfig);
  assert.ok(config.exclude.includes("worker"));
  assert.ok(config.exclude.includes("examples"));
});
