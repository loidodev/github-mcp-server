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

  constructor(githubToken: string) {
    this.server = new Server(
      {
        name: "github-mcp-server",
        version: "0.1.0",
        description: "MCP Server for interacting with the GitHub API",
      },
      {
        capabilities: {},
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
      switch (request.params.name) {
        case "git_status":
          return {
            result: this.handlers.gitStatus(request.params.params.repo_path),
          };
        case "git_diff_unstaged":
          return {
            result: this.handlers.gitDiffUnstaged(
              request.params.params.repo_path
            ),
          };
        case "git_diff_staged":
          return {
            result: this.handlers.gitDiffStaged(
              request.params.params.repo_path
            ),
          };
        case "git_diff":
          return {
            result: this.handlers.gitDiff(
              request.params.params.repo_path,
              request.params.params.target
            ),
          };
        case "git_commit":
          return {
            result: this.handlers.gitCommit(
              request.params.params.repo_path,
              request.params.params.message
            ),
          };
        case "git_add":
          return {
            result: this.handlers.gitAdd(
              request.params.params.repo_path,
              request.params.params.files
            ),
          };
        case "git_reset":
          return {
            result: this.handlers.gitReset(request.params.params.repo_path),
          };
        case "git_log":
          return {
            result: this.handlers.gitLog(
              request.params.params.repo_path,
              request.params.params.max_count
            ),
          };
        case "git_create_branch":
          return {
            result: this.handlers.gitCreateBranch(
              request.params.params.repo_path,
              request.params.params.branch_name,
              request.params.params.start_point
            ),
          };
        case "git_checkout":
          return {
            result: this.handlers.gitCheckout(
              request.params.params.repo_path,
              request.params.params.branch_name
            ),
          };
        case "git_show":
          return {
            result: this.handlers.gitShow(
              request.params.params.repo_path,
              request.params.params.revision
            ),
          };
        case "git_init":
          return {
            result: this.handlers.gitInit(request.params.params.repo_path),
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
