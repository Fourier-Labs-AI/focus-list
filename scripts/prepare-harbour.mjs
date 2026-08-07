import { access, cp, mkdir } from "node:fs/promises";

async function ensure(path) {
  try {
    await access(path);
  } catch {
    throw new Error(`Expected Next output is missing: ${path}`);
  }
}

await ensure(".next/standalone");
await ensure(".next/static");
await mkdir(".next/standalone/.next", { recursive: true });
await cp(".next/static", ".next/standalone/.next/static", { recursive: true, force: true });
await cp("public", ".next/standalone/public", { recursive: true, force: true });
