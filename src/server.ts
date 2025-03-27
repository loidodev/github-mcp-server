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
        capabilities: {
          tools: {},
        },
      }
    );

    this.handlers = new GitHubHandlers(githubToken);
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
        case "list_user_repos":
          return this.handlers.handleListUserRepos(request);
        case "get_repo":
          return this.handlers.handleGetRepo(request);
        case "create_repo":
          return this.handlers.handleCreateRepo(request);
        case "create_commit":
          return this.handlers.handleCreateCommit(request);
        case "push":
          return this.handlers.handlePush(request);
        case "pull":
          return this.handlers.handlePull(request);
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
