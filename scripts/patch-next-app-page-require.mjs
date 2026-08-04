/**
 * Next.js 16.2 Turbopack compiles app-page templates with bare `require('path')`
 * inside ESM chunks, which throws ReferenceError: require is not defined at runtime.
 * Replace with path-safe string join until Next ships an ESM-safe fix.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const targets = [
  "node_modules/next/dist/esm/build/templates/app-page.js",
  "node_modules/next/dist/build/templates/app-page.js",
  "node_modules/next/dist/esm/build/templates/app-page-runtime.js",
  "node_modules/next/dist/build/templates/app-page-runtime.js",
];

const needle =
  "require('path').join(/* turbopackIgnore: true */ process.cwd(), routeModule.relativeProjectDir)";
const replacement =
  "(routeModule.relativeProjectDir ? `${process.cwd()}/${routeModule.relativeProjectDir}` : process.cwd())";

let patched = 0;
let skipped = 0;

for (const relative of targets) {
  const filePath = join(root, relative);
  if (!existsSync(filePath)) {
    continue;
  }

  const source = readFileSync(filePath, "utf8");
  if (!source.includes(needle)) {
    if (source.includes(replacement)) {
      skipped += 1;
    }
    continue;
  }

  writeFileSync(filePath, source.split(needle).join(replacement), "utf8");
  patched += 1;
}

if (patched > 0) {
  console.log(`Patched Next.js app-page require() in ${patched} file(s).`);
} else if (skipped > 0) {
  console.log("Next.js app-page require() patch already applied.");
} else {
  console.log("Next.js app-page require() pattern not found — skip patch.");
}
