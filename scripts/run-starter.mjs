/**
 * Run a package script in every configured consumer starter that exists.
 *
 * Discovery comes from the registry target table plus filesystem existence.
 * Adding a starter is a table entry and a directory, not another framework
 * branch in this orchestrator.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consumerStarterDirectories } from "../bin/registry-targets.mjs";
import { rootDir } from "./registry-lib.mjs";

export function existingConsumerStarters({
  starters = consumerStarterDirectories(),
  exists = existsSync,
  root = rootDir,
} = {}) {
  return starters.filter(({ directory }) => exists(path.join(root, directory)));
}

export function starterNpmArguments(directory, script) {
  return ["--prefix", directory, "run", script];
}

export function spawnStarterScript(starter, script, {
  cwd = rootDir,
  env = process.env,
} = {}) {
  const npmExecPath = env.npm_execpath;
  if (!npmExecPath) {
    throw new Error("Run starter commands through `npm run starter:build` or `npm run starter:check`.");
  }

  console.log(`\n[starter] ${script} ${starter.directory}`);
  const startedAt = performance.now();

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [npmExecPath, ...starterNpmArguments(starter.directory, script)],
      { cwd, env, stdio: "inherit" },
    );

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      const seconds = ((performance.now() - startedAt) / 1000).toFixed(2);
      if (code === 0) {
        console.log(`[starter] pass ${starter.directory} ${script} (${seconds}s)`);
        resolve();
        return;
      }

      reject(new Error(
        signal
          ? `${starter.directory} ${script} terminated by ${signal} after ${seconds}s.`
          : `${starter.directory} ${script} exited ${code} after ${seconds}s.`,
      ));
    });
  });
}

export async function runStarterScript(script, {
  starters = existingConsumerStarters(),
  runStarter = spawnStarterScript,
} = {}) {
  if (typeof script !== "string" || script.length === 0) {
    throw new Error("Usage: node scripts/run-starter.mjs <script>");
  }
  if (!starters.length) {
    throw new Error("No consumer starter directories exist.");
  }

  for (const starter of starters) {
    await runStarter(starter, script);
  }
}

async function main() {
  await runStarterScript(process.argv[2]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
