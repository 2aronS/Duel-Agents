import { cp, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoIntegrations = join(here, "..", "..", "..", "integrations");
const packageIntegrations = join(here, "..", "integrations");

await rm(packageIntegrations, { recursive: true, force: true });
await cp(repoIntegrations, packageIntegrations, { recursive: true });
console.log("Copied integrations into packages/cli/integrations");
