import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// React's DOM test helpers need the test build, even inside a production build job.
const result = spawnSync(process.execPath, [
  fileURLToPath(new URL("../node_modules/vitest/vitest.mjs", import.meta.url)),
  "run", ...process.argv.slice(2),
], { stdio: "inherit", env: { ...process.env, NODE_ENV: "test" } });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
