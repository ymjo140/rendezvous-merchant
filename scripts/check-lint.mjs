import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { spawnSync } from "node:child_process";

// Existing debt is explicit per file and rule. New files receive no allowance.
const baseline = JSON.parse(readFileSync(new URL("./lint-baseline.json", import.meta.url), "utf8"));
const run = spawnSync(process.execPath, ["node_modules/eslint/bin/eslint.js", ".", "--format", "json"], {
  encoding: "utf8", maxBuffer: 20 * 1024 * 1024,
});
if (run.error || run.status === 2 || !run.stdout.trim()) {
  console.error(run.error?.message || run.stderr || "ESLint failed to run.");
  process.exit(1);
}
const results = JSON.parse(run.stdout);
let increased = 0, errors = 0, warnings = 0;
for (const result of results) {
  const file = relative(process.cwd(), result.filePath).replaceAll("\\", "/");
  const counts = {};
  errors += result.errorCount; warnings += result.warningCount;
  for (const message of result.messages) {
    const rule = `${message.ruleId}:${message.severity}`;
    counts[rule] = (counts[rule] ?? 0) + 1;
    if (message.fatal || counts[rule] > (baseline[file]?.[rule] ?? 0)) {
      ++increased;
      console.error(`${file}:${message.line} ${message.ruleId}: ${message.message}`);
    }
  }
}
console.log(`Lint: ${errors} existing errors, ${warnings} existing warnings; ${increased} new findings.`);
process.exit(increased ? 1 : 0);
