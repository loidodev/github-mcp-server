#!/usr/bin/env node
import { GitHubServer } from "./server.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// if (!GITHUB_TOKEN) {
//   console.error("GITHUB_TOKEN environment variable is required");
//   process.exit(1);
// }

try {
  const server = new GitHubServer();
  server.run().catch((error) => {
    console.error("Failed to start GitHub MCP server:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("Error initializing GitHubServer:", error);
  process.exit(1);
}
