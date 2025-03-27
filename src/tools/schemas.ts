import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolSchemas: Tool[] = [
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
        owner: {
          type: "string",
          description:
            "The account owner of the repository. If not provided, will use the authenticated user.",
        },
        repo: { type: "string" },
      },
      required: ["repo"],
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
          description:
            "The account owner of the repository. If not provided, will use the authenticated user.",
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
      required: ["repo", "message", "files"],
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
          description:
            "The account owner of the repository. If not provided, will use the authenticated user.",
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
      required: ["repo"],
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
          description:
            "The account owner of the repository. If not provided, will use the authenticated user.",
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
      required: ["repo", "branch"],
    },
  },
  {
    name: "git_status",
    description:
      "Get the status of a git repository including branch information and changes.",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description:
            "The account owner of the repository. If not provided, will use the authenticated user.",
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
      required: ["repo"],
    },
  },
];
