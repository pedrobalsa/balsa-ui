import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { readJson } from "./registry-lib.mjs";

const managers = new Set(["npm", "pnpm", "yarn", "bun"]);
const lockfiles = {
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
  "bun.lock": "bun",
  "bun.lockb": "bun",
  "package-lock.json": "npm",
  "npm-shrinkwrap.json": "npm",
};
const packageName = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function packageManagerField(value, source) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`${source} packageManager must be a string.`);
  }
  const match = /^([a-z]+)@/.exec(value);
  const manager = match?.[1];
  if (!manager || !managers.has(manager)) {
    throw new Error(
      `${source} selects an unsupported package manager: ${value}. Supported managers: npm, pnpm, yarn, bun.`,
    );
  }
  return manager;
}

/**
 * Honor the nearest packageManager declaration first, then one unambiguous
 * lockfile. Walking upward keeps workspace packages on their repository's
 * manager; a project with neither safely falls back to npm.
 */
export async function detectPackageManager(cwd) {
  let directory = path.resolve(cwd);
  let first = true;
  while (true) {
    let hasPackageJson = false;
    try {
      const packageJson = await readJson(path.join(directory, "package.json"));
      hasPackageJson = true;
      const declared = packageManagerField(packageJson.packageManager, path.join(directory, "package.json"));
      if (declared) return { manager: declared, source: "packageManager", directory };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    const found = [];
    // The target's lockfile is authoritative. Above it, only a directory that
    // is itself a package/workspace root may select the manager; unrelated
    // files in a generic parent such as the OS temp directory must not leak in.
    if (first || hasPackageJson) {
      for (const [file, manager] of Object.entries(lockfiles)) {
        if (await exists(path.join(directory, file))) found.push({ file, manager });
      }
    }
    const distinct = [...new Set(found.map(({ manager }) => manager))];
    if (distinct.length > 1) {
      throw new Error(
        `Multiple package managers are represented in ${directory}: ${found.map(({ file }) => file).join(", ")}.`
        + " Remove stale lockfiles or set packageManager in package.json.",
      );
    }
    if (distinct.length === 1) {
      return { manager: distinct[0], source: found[0].file, directory };
    }

    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
    first = false;
  }
  return { manager: "npm", source: "default", directory: path.resolve(cwd) };
}

function installArguments(manager, dependencies) {
  if (manager === "npm") {
    return ["install", "--save", "--no-audit", "--no-fund", ...dependencies];
  }
  return ["add", ...dependencies];
}

function execute(command, args, cwd, { shell = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        npm_config_audit: "false",
        npm_config_fund: "false",
      },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else {
        const detail = stderr.trim() || stdout.trim() || `exit code ${String(code)}`;
        reject(new Error(`${command} ${args[0]} failed: ${detail}`));
      }
    });
  });
}

export async function installProjectDependencies(cwd, dependencies) {
  const wanted = [...new Set(dependencies)].sort();
  if (!wanted.length) {
    return { manager: undefined, installed: [], unresolved: [] };
  }
  const invalid = wanted.find((dependency) => !packageName.test(dependency));
  if (invalid) throw new Error(`Refusing to install invalid npm dependency name: ${invalid}.`);

  try {
    await readJson(path.join(cwd, "package.json"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        manager: undefined,
        installed: [],
        unresolved: wanted,
        reason: "No package.json was found, so Balsa did not run a package manager.",
      };
    }
    throw error;
  }

  const detected = await detectPackageManager(cwd);
  const args = installArguments(detected.manager, wanted);
  const inheritedExecPath = process.env.npm_execpath;
  const inheritedManagerMatches = detected.manager !== "bun" && inheritedExecPath
    ? path.basename(inheritedExecPath).toLowerCase().includes(detected.manager)
    : false;
  const managerExecPath = process.env.BALSA_PACKAGE_MANAGER_EXEC_PATH
    ?? (inheritedManagerMatches ? inheritedExecPath : undefined);
  try {
    if (managerExecPath) {
      await execute(process.execPath, [managerExecPath, ...args], cwd);
    } else {
      await execute(
        process.platform === "win32" ? `${detected.manager}.cmd` : detected.manager,
        args,
        cwd,
        { shell: process.platform === "win32" },
      );
    }
  } catch (error) {
    throw new Error(
      `Could not install npm dependencies with ${detected.manager} (${detected.source}): ${error.message}`,
    );
  }
  return {
    manager: detected.manager,
    source: detected.source,
    installed: wanted,
    unresolved: [],
  };
}
