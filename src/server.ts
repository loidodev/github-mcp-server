import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { GitHubHandlers } from "./tools/handlers.js";
import { toolSchemas } from "./tools/schemas.js";

export class GitHubServer {
  private server: Server;
  private handlers: GitHubHandlers;

  constructor() {
    this.server = new Server(
      {
        name: "github-mcp-server",
        version: "0.1.0",
        description: "MCP Server for interacting with the GitHub API",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.handlers = new GitHubHandlers();
    this.setupToolHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolSchemas,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments;

      switch (toolName) {
        case "git_status":
          return {
            result: this.handlers.gitStatus((args as any).repo_path),
          };
        case "git_diff_unstaged":
          return {
            result: this.handlers.gitDiffUnstaged((args as any).repo_path),
          };
        case "git_diff_staged":
          return {
            result: this.handlers.gitDiffStaged((args as any).repo_path),
          };
        case "git_diff":
          return {
            result: this.handlers.gitDiff(
              (args as any).repo_path,
              (args as any).target
            ),
          };
        case "git_commit":
          return {
            result: this.handlers.gitCommit(
              (args as any).repo_path,
              (args as any).message
            ),
          };
        case "git_add":
          return {
            result: this.handlers.gitAdd((args as any).repo_path),
          };
        case "git_reset":
          return {
            result: this.handlers.gitReset((args as any).repo_path),
          };
        case "git_log":
          return {
            result: this.handlers.gitLog(
              (args as any).repo_path,
              (args as any).max_count
            ),
          };
        case "git_create_branch":
          return {
            result: this.handlers.gitCreateBranch(
              (args as any).repo_path,
              (args as any).branch_name,
              (args as any).start_point
            ),
          };
        case "git_checkout":
          return {
            result: this.handlers.gitCheckout(
              (args as any).repo_path,
              (args as any).branch_name
            ),
          };
        case "git_show":
          return {
            result: this.handlers.gitShow(
              (args as any).repo_path,
              (args as any).revision
            ),
          };
        case "git_init":
          return {
            result: this.handlers.gitInit((args as any).repo_path),
          };
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("GitHub MCP server running on stdio");
  }
}
