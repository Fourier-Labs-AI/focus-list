import { access, cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const basePathMarker = "/__HARBOUR_BASE_PATH__";
const basePath = process.env.HARBOUR_BASE_PATH || "";

async function ensure(path) {
  try {
    await access(path);
  } catch {
    throw new Error(`Expected Next output is missing: ${path}`);
  }
}

async function replaceMarker(root) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      await replaceMarker(path);
      continue;
    }
    const contents = await readFile(path);
    const marker = Buffer.from(basePathMarker);
    if (!contents.includes(marker)) continue;
    await writeFile(path, contents.toString().split(basePathMarker).join(basePath));
  }
}

async function setProductionServerDefaults() {
  const serverPath = ".next/standalone/server.js";
  const source = await readFile(serverPath, "utf8");
  const portPattern = /parseInt\(process\.env\.PORT,\s*10\)\s*\|\|\s*3000/;
  if (!portPattern.test(source)) {
    throw new Error("Expected Next standalone PORT default was not found");
  }
  const updated = source.replace(
    portPattern,
    "parseInt(process.env.PORT, 10) || 8080",
  );
  const hostnamePattern = /process\.env\.HOSTNAME\s*\|\|\s*["']0\.0\.0\.0["']/;
  if (!hostnamePattern.test(updated)) {
    throw new Error("Next standalone server does not default HOSTNAME to 0.0.0.0");
  }
  await writeFile(serverPath, updated);
}

await ensure(".next/standalone");
await ensure(".next/static");
await setProductionServerDefaults();
await rm(".next/standalone/.next/static", { recursive: true, force: true });
await cp("public", ".next/standalone/public", { recursive: true, force: true });
await replaceMarker(".next/standalone");
await replaceMarker(".next/static");
