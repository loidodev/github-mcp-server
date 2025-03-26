#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

type ListUserReposParams =
  RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["parameters"];
type GetRepoParams = RestEndpointMethodTypes["repos"]["get"]["parameters"];
type CreateRepoParams =
  RestEndpointMethodTypes["repos"]["createForAuthenticatedUser"]["parameters"];
type CreateCommitParams = {
  owner: string;
  repo: string;
  branch?: string;
  message: string;
  files: Array<{
    path: string;
    content: string;
  }>;
};
type PushParams = {
  owner: string;
  repo: string;
  branch?: string;
};
type PullParams = {
  owner: string;
  repo: string;
  branch: string;
};

function isValidListUserReposArgs(args: any): args is ListUserReposParams {
  return typeof args === "object" && args !== null;
}

function isValidGetRepoArgs(args: any): args is GetRepoParams {
  return (
    typeof args === "object" &&
    args !== null &&
    typeof args.owner === "string" &&
    typeof args.repo === "string"
  );
}

function isValidCreateRepoArgs(args: any): args is CreateRepoParams {
  return (
    typeof args === "object" && args !== null && typeof args.name === "string"
  );
}

function isValidCreateCommitArgs(args: any): args is CreateCommitParams {
  return (
    typeof args === "object" &&
    args !== null &&
    typeof args.owner === "string" &&
    typeof args.repo === "string" &&
    typeof args.message === "string" &&
    Array.isArray(args.files) &&
    args.files.every(
      (file: any) =>
        typeof file.path === "string" && typeof file.content === "string"
    )
  );
}

function isValidPushArgs(args: any): args is PushParams {
  return (
    typeof args === "object" &&
    args !== null &&
    typeof args.owner === "string" &&
    typeof args.repo === "string"
  );
}

function isValidPullArgs(args: any): args is PullParams {
  return (
    typeof args === "object" &&
    args !== null &&
    typeof args.owner === "string" &&
    typeof args.repo === "string" &&
    typeof args.branch === "string"
  );
}

class GitHubServer {
  private server: Server;
  private octokit: Octokit;

  constructor() {
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

    this.octokit = new Octokit({ auth: GITHUB_TOKEN });
    this.setupToolHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_user_repos",
          description: "List repositories for the authenticated user.",
          inputSchema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["owner", "all", "member"],
                default: "owner",
              },
              sort: {
                type: "string",
                enum: ["created", "updated", "pushed", "full_name"],
                default: "full_name",
              },
              direction: {
                type: "string",
                enum: ["asc", "desc"],
                default: "asc",
              },
              per_page: { type: "number", default: 30, maximum: 100 },
              page: { type: "number", default: 1 },
            },
            required: [],
          },
        },
        {
          name: "get_repo",
          description: "Get details about a specific repository.",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string" },
              repo: { type: "string" },
            },
            required: ["owner", "repo"],
          },
        },
        {
          name: "create_repo",
          description: "Create a new repository.",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The name of the repository",
              },
              description: {
                type: "string",
                description: "A short description of the repository",
              },
              private: {
                type: "boolean",
                description: "Whether the repository is private",
                default: false,
              },
              auto_init: {
                type: "boolean",
                description: "Create an initial commit with empty README",
                default: false,
              },
            },
            required: ["name"],
          },
        },
        {
          name: "create_commit",
          description: "Create a new commit with file changes.",
          inputSchema: {
            type: "object",
            properties: {
              owner: {
                type: "string",
                description: "The account owner of the repository",
              },
              repo: {
                type: "string",
                description: "The name of the repository",
              },
              branch: {
                type: "string",
                description: "The branch name",
                default: "main",
              },
              message: { type: "string", description: "The commit message" },
              files: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    path: {
                      type: "string",
                      description: "File path relative to repository root",
                    },
                    content: { type: "string", description: "File content" },
                  },
                  required: ["path", "content"],
                },
                description: "Files to include in the commit",
              },
            },
            required: ["owner", "repo", "message", "files"],
          },
        },
        {
          name: "push",
          description: "Push changes to a remote repository.",
          inputSchema: {
            type: "object",
            properties: {
              owner: {
                type: "string",
                description: "The account owner of the repository",
              },
              repo: {
                type: "string",
                description: "The name of the repository",
              },
              branch: {
                type: "string",
                description: "The branch name",
                default: "main",
              },
            },
            required: ["owner", "repo"],
          },
        },
        {
          name: "pull",
          description: "Pull changes from a remote repository.",
          inputSchema: {
            type: "object",
            properties: {
              owner: {
                type: "string",
                description: "The account owner of the repository",
              },
              repo: {
                type: "string",
                description: "The name of the repository",
              },
              branch: {
                type: "string",
                description: "The branch name",
                default: "main",
              },
            },
            required: ["owner", "repo", "branch"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "list_user_repos":
          return this.handleListUserRepos(request);
        case "get_repo":
          return this.handleGetRepo(request);
        case "create_repo":
          return this.handleCreateRepo(request);
        case "create_commit":
          return this.handleCreateCommit(request);
        case "push":
          return this.handlePush(request);
        case "pull":
          return this.handlePull(request);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async handleListUserRepos(request: any) {
    const args = request.params.arguments;
    if (!isValidListUserReposArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid arguments for list_user_repos"
      );
    }

    const response = await this.octokit.repos.listForAuthenticatedUser(args);
    const repoData = response.data.map((repo) => ({
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      private: repo.private,
      fork: repo.fork,
      stargazers_count: repo.stargazers_count,
      watchers_count: repo.watchers_count,
      language: repo.language,
      updated_at: repo.updated_at,
    }));

    return {
      content: [
        {
          type: "application/json",
          text: JSON.stringify(repoData, null, 2),
        },
      ],
    };
  }

  private async handleGetRepo(request: any) {
    const args = request.params.arguments;
    if (!isValidGetRepoArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid arguments for get_repo"
      );
    }

    const response = await this.octokit.repos.get(args);
    const repoDetails = {
      name: response.data.name,
      full_name: response.data.full_name,
      description: response.data.description,
      html_url: response.data.html_url,
      private: response.data.private,
      fork: response.data.fork,
      stargazers_count: response.data.stargazers_count,
      watchers_count: response.data.watchers_count,
      forks_count: response.data.forks_count,
      open_issues_count: response.data.open_issues_count,
      language: response.data.language,
      updated_at: response.data.updated_at,
      license: response.data.license?.name,
      topics: response.data.topics,
    };

    return {
      content: [
        {
          type: "application/json",
          text: JSON.stringify(repoDetails, null, 2),
        },
      ],
    };
  }

  private async handleCreateRepo(request: any) {
    const args = request.params.arguments;
    if (!isValidCreateRepoArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid arguments for create_repo"
      );
    }

    const response = await this.octokit.repos.createForAuthenticatedUser(args);
    return {
      content: [
        {
          type: "application/json",
          text: JSON.stringify(
            {
              name: response.data.name,
              full_name: response.data.full_name,
              html_url: response.data.html_url,
              private: response.data.private,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleCreateCommit(request: any) {
    const args = request.params.arguments;
    if (!isValidCreateCommitArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid arguments for create_commit"
      );
    }

    // Get the current commit SHA for the branch
    const { data: refData } = await this.octokit.git.getRef({
      owner: args.owner,
      repo: args.repo,
      ref: `heads/${args.branch || "main"}`,
    });

    // Get the current tree SHA
    const { data: commitData } = await this.octokit.git.getCommit({
      owner: args.owner,
      repo: args.repo,
      commit_sha: refData.object.sha,
    });

    // Create blobs for each file
    const blobs = await Promise.all(
      args.files.map(async (file) => {
        const { data } = await this.octokit.git.createBlob({
          owner: args.owner,
          repo: args.repo,
          content: file.content,
          encoding: "utf-8",
        });
        return {
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: data.sha,
        };
      })
    );

    // Create a new tree
    const { data: newTree } = await this.octokit.git.createTree({
      owner: args.owner,
      repo: args.repo,
      base_tree: commitData.tree.sha,
      tree: blobs,
    });

    // Create a new commit
    const { data: newCommit } = await this.octokit.git.createCommit({
      owner: args.owner,
      repo: args.repo,
      message: args.message,
      tree: newTree.sha,
      parents: [refData.object.sha],
    });

    // Update the branch reference
    await this.octokit.git.updateRef({
      owner: args.owner,
      repo: args.repo,
      ref: `heads/${args.branch || "main"}`,
      sha: newCommit.sha,
    });

    return {
      content: [
        {
          type: "application/json",
          text: JSON.stringify(
            {
              commit_sha: newCommit.sha,
              html_url: `https://github.com/${args.owner}/${args.repo}/commit/${newCommit.sha}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handlePush(request: any) {
    const args = request.params.arguments;
    if (!isValidPushArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, "Invalid arguments for push");
    }

    // In GitHub's API, push is implicit when you update references (like in create_commit)
    // So we'll just return success since the actual push happens during commit
    return {
      content: [
        {
          type: "application/json",
          text: JSON.stringify(
            {
              message:
                "Push successful (changes are automatically pushed when commits are created)",
              branch: args.branch || "main",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handlePull(request: any) {
    const args = request.params.arguments;
    if (!isValidPullArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, "Invalid arguments for pull");
    }

    // Get the latest commit for the branch
    const { data: commitData } = await this.octokit.repos.getCommit({
      owner: args.owner,
      repo: args.repo,
      ref: args.branch,
    });

    return {
      content: [
        {
          type: "application/json",
          text: JSON.stringify(
            {
              commit_sha: commitData.sha,
              html_url: commitData.html_url,
              message: commitData.commit.message,
              author: commitData.commit.author?.name,
              date: commitData.commit.author?.date,
              files_changed: commitData.files?.map((f) => f.filename) || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("GitHub MCP server running on stdio");
  }
}

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
