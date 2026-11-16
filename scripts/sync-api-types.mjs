#!/usr/bin/env node
import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const backendSpec = resolve(repoRoot, "../rupakarsa-backend/openapi.json");
const sharedSpec = resolve(repoRoot, "packages/shared/openapi.json");
const output = resolve(repoRoot, "packages/shared/src/lib/api-schema.d.ts");

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

if (await exists(backendSpec)) {
  await mkdir(dirname(sharedSpec), { recursive: true });
  await copyFile(backendSpec, sharedSpec);
  process.stdout.write(`Copied ${backendSpec} → ${sharedSpec}\n`);
} else if (await exists(sharedSpec)) {
  process.stdout.write(`Using committed ${sharedSpec}\n`);
} else {
  process.stderr.write(
    "No OpenAPI document found. Run `npm run openapi` in ../rupakarsa-backend first.\n",
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [resolve(repoRoot, "node_modules/openapi-typescript/bin/cli.js"), sharedSpec, "-o", output],
  { stdio: "inherit", cwd: repoRoot },
);

if (result.status !== 0) process.exit(result.status ?? 1);
process.stdout.write(`Wrote ${output}\n`);
