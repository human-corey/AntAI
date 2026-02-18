import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  console.log("🐜 AntAI Setup\n");

  // 1. Check for Claude CLI
  console.log("Checking for Claude CLI...");
  try {
    const version = execSync("claude --version", { encoding: "utf-8" }).trim();
    console.log(`  Found: ${version}`);
  } catch {
    console.warn(
      "  ⚠ Claude CLI not found. Install it from https://docs.anthropic.com/en/docs/claude-code"
    );
    console.warn("  AntAI will still work but cannot spawn agent teams.\n");
  }

  // 2. Create data directory
  const dataDir = path.join(ROOT, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("Created data/ directory");
  } else {
    console.log("data/ directory exists");
  }

  // 3. Push database schema
  console.log("Pushing database schema...");
  try {
    execSync("bun run db:push", { cwd: ROOT, stdio: "inherit" });
    console.log("Database schema pushed successfully");
  } catch (e) {
    console.error("Failed to push database schema:", e);
    process.exit(1);
  }

  // 4. Seed built-in templates
  // Uses a sub-process with node to avoid bun's lack of better-sqlite3 support
  console.log("Seeding built-in templates...");
  try {
    execSync("npx tsx scripts/seed-templates.ts", {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch (e) {
    console.error("Failed to seed templates:", e);
  }

  console.log("\n✅ Setup complete! Run `bun dev` to start AntAI.");
}

main();
