import { spawnSync } from "node:child_process";

const [action, ...extraArgs] = process.argv.slice(2);

if (extraArgs.length > 0 || !["up", "down"].includes(action)) {
  console.error("Uso: pnpm db <up|down>");
  process.exitCode = 1;
} else {
  const args =
    action === "up"
      ? ["compose", "up", "-d", "--no-deps", "db"]
      : ["compose", "stop", "db"];
  const result = spawnSync("docker", args, { stdio: "inherit" });

  if (result.error) {
    console.error(result.error.message);
  }

  process.exitCode = result.status ?? 1;
}
