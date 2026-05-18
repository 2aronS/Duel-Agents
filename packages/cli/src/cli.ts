#!/usr/bin/env node
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  DASHBOARD_URL,
  requireApiKey,
  validateApiKey,
} from "@duel-agents/core";
import { runDoctor, runInstall, resolveApiKeyFromEnv } from "./install.js";

const USAGE = `
@duel-agents/install — route your IDE through Duel Agents

Usage:
  npx @duel-agents/install [target]
  npx @duel-agents/install doctor

Targets:
  claude-code   Anthropic-compatible (Claude Code)
  cursor        Cursor editor + project skill
  codex         OpenAI-compatible (Codex CLI)
  openclaw      OpenClaw gateway config
  all           Install all targets
  (omit)        Install all targets interactively

Environment:
  DUEL_API_KEY or DUEL_AGENTS_API_KEY — your Duel API key (required)

Get a key: ${DASHBOARD_URL}
`.trim();

async function promptForKey(): Promise<string> {
  const fromEnv = resolveApiKeyFromEnv();
  if (fromEnv && validateApiKey(fromEnv)) return fromEnv;
  if (fromEnv && !validateApiKey(fromEnv)) {
    console.warn(
      "⚠ DUEL_API_KEY is set but has invalid format — you'll be prompted for a new key.",
    );
  }

  const rl = readline.createInterface({ input, output });
  try {
    console.log(`Get your Duel API key at ${DASHBOARD_URL}\n`);
    const key = await rl.question("Paste your Duel API key: ");
    return requireApiKey(key.trim());
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }

  const target = args[0];

  if (target === "doctor") {
    const key = resolveApiKeyFromEnv();
    if (!key) {
      console.error(
        `Set DUEL_API_KEY or DUEL_AGENTS_API_KEY. Get a key at ${DASHBOARD_URL}`,
      );
      process.exit(1);
    }
    process.exit(await runDoctor(key));
  }

  let apiKey: string;
  try {
    apiKey = await promptForKey();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const code = await runInstall(target, apiKey);
  process.exit(code);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
