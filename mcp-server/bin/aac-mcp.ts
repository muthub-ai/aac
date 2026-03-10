#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "../src/server.js";
import { resolveRepoRoot } from "../src/lib/repo-resolver.js";

async function main(): Promise<void> {
  // Parse --root flag from argv
  const args = process.argv.slice(2);
  let rootArg: string | undefined;
  const rootIdx = args.indexOf("--root");
  if (rootIdx !== -1 && args[rootIdx + 1]) {
    rootArg = args[rootIdx + 1];
  }

  const repoRoot = resolveRepoRoot(rootArg);
  console.error(`[aac-mcp] Repository root: ${repoRoot}`);

  const { server } = createServer(repoRoot);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[aac-mcp] Server running on stdio");

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error: unknown) => {
  console.error("[aac-mcp] Fatal error:", error);
  process.exit(1);
});
