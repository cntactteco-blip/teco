import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const stages = [
  ["snapshot", process.execPath, ["scripts/snapshot.mjs"]],
  ["vite", "vite", ["build", "--config", "vite.config.cloudflare.ts"]],
  ["prerender", process.execPath, ["scripts/prerender.mjs"]],
];

const report = {
  node: process.version,
  stages: [],
};

for (const [name, command, args] of stages) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  report.stages.push({ name, status: result.status, signal: result.signal });
  if (result.status !== 0) break;
}

mkdirSync("dist/public", { recursive: true });
writeFileSync("dist/public/build-diagnostics.json", JSON.stringify(report, null, 2));

// Preview-only diagnostic: publish the report even when a build stage fails.
process.exitCode = 0;
