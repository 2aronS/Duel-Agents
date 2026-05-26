import { existsSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkConnectivity,
  DASHBOARD_URL,
  getProxyUrl,
  installTargetEnv,
  requireApiKey,
  validateApiKey,
  type InstallTarget,
} from "@duel-agents/core";

const ALL_TARGETS: InstallTarget[] = [
  "claude-code",
  "cursor",
  "codex",
  "openclaw",
];

export function resolveIntegrationPath(...parts: string[]): string {
  const here = dirname(fileURLToPath(import.meta.url));

  const candidates = [
    // Published npm layout: @duel-agents/install/integrations
    join(here, "..", "integrations", ...parts),
    // Monorepo dev: packages/cli/dist -> duel-agents/integrations
    join(here, "..", "..", "..", "integrations", ...parts),
    // Running via tsx from src/
    join(here, "..", "..", "integrations", ...parts),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    `Integration assets not found (${parts.join("/")}). Reinstall @duel-agents/install or run from the duel-agents repo.`,
  );
}

function cursorInstructions(): string {
  const proxyUrl = getProxyUrl();
  return `
Cursor setup (manual UI step required):
1. Open Cursor → Settings → Models
2. Enable "Override OpenAI Base URL"
3. Set base URL to: ${proxyUrl}
4. Set API key to your Duel API key (duel_…)
5. Select a model that routes through your OpenAI override

DUEL_API_KEY was written to your project .env for scripts and the Duel skill.
`.trim();
}

export function resolveApiKeyFromEnv(): string | undefined {
  return (
    process.env.DUEL_API_KEY?.trim() ||
    process.env.DUEL_AGENTS_API_KEY?.trim()
  );
}

export async function runDoctor(apiKey: string): Promise<number> {
  console.log("Duel Agents doctor\n");

  if (!validateApiKey(apiKey)) {
    console.error("✗ Invalid API key format.");
    console.error(`  Get a key at ${DASHBOARD_URL}`);
    return 1;
  }

  console.log(`✓ Key format valid (duel_${apiKey.slice(5, 13)}_…)`);

  const result = await checkConnectivity(apiKey);
  if (result.ok) {
    console.log(`✓ ${result.message}`);
    return 0;
  }

  if (result.status === "unauthorized") {
    console.error(`✗ ${result.message}`);
    return 1;
  }

  if (result.status === "invalid_key") {
    console.error(`✗ ${result.message}`);
    return 1;
  }

  console.warn(`⚠ ${result.message}`);
  console.warn("  Key format is valid but live check failed — try again later.");
  return 0;
}

export async function installForTarget(
  target: InstallTarget,
  apiKey: string,
): Promise<void> {
  requireApiKey(apiKey);

  if (target === "cursor") {
    const { path, warnings } = await installTargetEnv("cursor", apiKey);
    for (const w of warnings) console.warn(`⚠ ${w}`);
    await copyCursorSkill(process.cwd());
    console.log(`\n✓ Wrote ${path}`);
    console.log(cursorInstructions());
    return;
  }

  const { path, warnings } = await installTargetEnv(target, apiKey);
  for (const w of warnings) console.warn(`⚠ ${w}`);
  console.log(`✓ Installed Duel Agents for ${target}`);
  console.log(`  Updated: ${path}`);

  if (target === "openclaw") {
    console.log("\nNext steps:");
    console.log("  1. Run: openclaw config validate");
    console.log("  2. Restart the OpenClaw gateway if it is running");
    console.log("  3. Default model is duel/duel-auto (existing default preserved on re-install)");
    console.log("  4. API key stored in ~/.openclaw/.env (not in openclaw.json)");
    await copyOpenClawSkill();
  }

  if (target === "claude-code") {
    console.log("\nRestart Claude Code to pick up ~/.claude/.env");
  }

  if (target === "codex") {
    console.log("\nRestart Codex CLI or reload your shell to pick up .env");
  }
}

async function copyCursorSkill(cwd: string): Promise<void> {
  const src = resolveIntegrationPath("cursor", "skills", "duel-agents");
  const dest = join(cwd, ".cursor", "skills", "duel-agents");
  await mkdir(dirname(dest), { recursive: true });
  await cp(src, dest, { recursive: true, force: true });
  console.log(`✓ Copied Cursor skill to ${dest}`);
}

async function copyOpenClawSkill(): Promise<void> {
  const src = resolveIntegrationPath("openclaw", "skills", "duel-agents");
  const dest = join(
    homedir(),
    ".openclaw",
    "workspace",
    "skills",
    "duel-agents",
  );
  await mkdir(dirname(dest), { recursive: true });
  await cp(src, dest, { recursive: true, force: true });
  console.log(`✓ Copied OpenClaw skill to ${dest}`);
}

export async function runInstall(
  targetArg: string | undefined,
  apiKey: string,
): Promise<number> {
  requireApiKey(apiKey);

  if (targetArg === "doctor") {
    return runDoctor(apiKey);
  }

  if (!targetArg) {
    console.log("Installing Duel Agents for all supported tools…\n");
    for (const t of ALL_TARGETS) {
      await installForTarget(t, apiKey);
      console.log("");
    }
    return runDoctor(apiKey);
  }

  if (targetArg === "all") {
    for (const t of ALL_TARGETS) {
      await installForTarget(t, apiKey);
      console.log("");
    }
    return runDoctor(apiKey);
  }

  if (!ALL_TARGETS.includes(targetArg as InstallTarget)) {
    console.error(`Unknown target: ${targetArg}`);
    console.error(`Valid targets: ${ALL_TARGETS.join(", ")}, all, doctor`);
    return 1;
  }

  await installForTarget(targetArg as InstallTarget, apiKey);
  return 0;
}

export { ALL_TARGETS };
