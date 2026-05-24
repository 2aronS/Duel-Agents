import { access, copyFile, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { homedir } from "node:os";
import JSON5 from "json5";
import {
  buildOpenClawPatch,
  deepMerge,
  getEnvForTarget,
  getProxyUrl,
  requireApiKey,
  type InstallTarget,
} from "./config.js";

function isPathInside(child: string, parent: string): boolean {
  const resolvedChild = resolve(child);
  const resolvedParent = resolve(parent);
  if (resolvedChild === resolvedParent) return true;

  const prefix = resolvedParent.endsWith(sep)
    ? resolvedParent
    : resolvedParent + sep;

  // Cross-drive paths on Windows make relative() return an absolute path.
  const rel = relative(resolvedParent, resolvedChild);
  if (rel === ".." || rel.startsWith(`..${sep}`)) return false;
  if (rel.includes(":") || rel.startsWith(sep)) return false;

  return resolvedChild.startsWith(prefix);
}

export function resolveOpenClawConfigPath(): string {
  const openclawDir = resolve(homedir(), ".openclaw");
  const fromEnv = process.env.OPENCLAW_CONFIG_PATH?.trim();
  if (!fromEnv) return join(openclawDir, "openclaw.json");

  const resolved = resolve(fromEnv);
  if (!isPathInside(resolved, openclawDir)) {
    throw new Error(
      `OPENCLAW_CONFIG_PATH must be inside ${openclawDir}. Got: ${fromEnv}`,
    );
  }
  return resolved;
}

export function resolveClaudeEnvPath(): string {
  return join(homedir(), ".claude", ".env");
}

export function resolveCodexEnvPath(cwd = process.cwd()): string {
  return join(cwd, ".env");
}

function parseEnvLine(line: string): { key: string; value: string } | null {
  let trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  if (trimmed.startsWith("export ")) trimmed = trimmed.slice(7).trim();
  const eq = trimmed.indexOf("=");
  if (eq === -1) return null;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

const PROVIDER_KEYS = new Set(["ANTHROPIC_API_KEY", "OPENAI_API_KEY"]);

export function scanEnvConflicts(
  existing: string,
  vars: Record<string, string>,
): string[] {
  const warnings: string[] = [];

  for (const line of existing.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (!PROVIDER_KEYS.has(parsed.key)) continue;
    if (!(parsed.key in vars)) continue;
    if (parsed.value.startsWith("duel_")) continue;

    warnings.push(
      `${parsed.key} will be replaced with your Duel API key (previous value was not a duel_* key).`,
    );
  }

  return warnings;
}

export async function mergeEnvFile(
  filePath: string,
  vars: Record<string, string>,
): Promise<string[]> {
  await mkdir(dirname(filePath), { recursive: true });

  let existing = "";
  try {
    existing = await readFile(filePath, "utf8");
  } catch {
    existing = "";
  }

  const warnings = scanEnvConflicts(existing, vars);
  const lines = existing.split(/\r?\n/);
  const keys = new Set(Object.keys(vars));
  const kept: string[] = [];

  for (const line of lines) {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      kept.push(line);
      continue;
    }
    if (keys.has(parsed.key)) continue;
    kept.push(line);
  }

  while (kept.length > 0 && kept[kept.length - 1] === "") {
    kept.pop();
  }

  const newLines = Object.entries(vars).map(([k, v]) => `${k}=${quoteEnv(v)}`);
  const body = [...kept, ...newLines, ""].join("\n");
  await writeFile(filePath, body, "utf8");
  return warnings;
}

function quoteEnv(value: string): string {
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export async function patchOpenClawConfig(
  configPath: string,
  apiKey: string,
  proxyUrl = getProxyUrl(),
): Promise<void> {
  requireApiKey(apiKey);
  const patch = buildOpenClawPatch(apiKey, proxyUrl);

  let current: Record<string, unknown> = {};
  try {
    const raw = await readFile(configPath, "utf8");
    try {
      current = JSON5.parse(raw) as Record<string, unknown>;
    } catch (parseErr) {
      throw new Error(
        `Could not parse OpenClaw config at ${configPath}: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      current = {};
    } else {
      throw err;
    }
  }

  await mkdir(dirname(configPath), { recursive: true });

  try {
    await access(configPath);
    await copyFile(configPath, `${configPath}.bak`);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }

  const merged = deepMerge(current, patch);
  await writeFile(configPath, JSON5.stringify(merged, null, 2) + "\n", "utf8");
}

async function writeTargetEnv(
  target: InstallTarget,
  apiKey: string,
  proxyUrl = getProxyUrl(),
): Promise<{ path: string; vars: Record<string, string>; warnings: string[] }> {
  const vars = getEnvForTarget(target, apiKey, proxyUrl);
  const path =
    target === "claude-code"
      ? resolveClaudeEnvPath()
      : target === "openclaw"
        ? resolveOpenClawConfigPath()
        : resolveCodexEnvPath();

  if (target === "openclaw") {
    await patchOpenClawConfig(path, apiKey, proxyUrl);
    return { path, vars, warnings: [] };
  }

  const warnings = await mergeEnvFile(path, vars);
  return { path, vars, warnings };
}

export async function installTargetEnv(
  target: InstallTarget,
  apiKey: string,
  proxyUrl = getProxyUrl(),
): Promise<{ path: string; vars: Record<string, string>; warnings: string[] }> {
  switch (target) {
    case "claude-code":
    case "codex":
    case "openai-compat":
    case "cursor":
    case "openclaw":
      return writeTargetEnv(target, apiKey, proxyUrl);
    default:
      throw new Error(`Unknown target: ${target}`);
  }
}

export {
  buildOpenClawPatch,
  checkConnectivity,
  deepMerge,
  getEnvForTarget,
  getProxyUrl,
  requireApiKey,
  validateApiKey,
  DEFAULT_PROXY_URL,
  DASHBOARD_URL,
  KEY_DOCS_URL,
} from "./config.js";
export type { ConnectivityResult, InstallTarget } from "./config.js";
