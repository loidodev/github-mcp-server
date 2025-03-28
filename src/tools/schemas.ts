import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Note: We are defining input schemas using plain objects that conform
// to a JSON Schema-like structure expected by the Tool type, not using Zod directly here.

export const toolSchemas: Tool[] = [
  {
    name: "git_status",
    description: "Shows the working tree status",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
      },
      required: ["repo_path"],
    },
  },
  {
    name: "git_diff_unstaged",
    description: "Shows changes in working directory not yet staged",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
      },
      required: ["repo_path"],
    },
  },
  {
    name: "git_diff_staged",
    description: "Shows changes that are staged for commit",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
      },
      required: ["repo_path"],
    },
  },
  {
    name: "git_diff",
    description: "Shows differences between branches or commits",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
        target: {
          type: "string",
          description: "Target branch or commit to compare with",
        },
      },
      required: ["repo_path", "target"],
    },
  },
  {
    name: "git_commit",
    description: "Records changes to the repository",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
        message: {
          type: "string",
          description: "Commit message",
        },
      },
      required: ["repo_path", "message"],
    },
  },
  {
    name: "git_add",
    description: "Adds file contents to the staging area",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
        files: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Array of file paths to stage",
        },
      },
      required: ["repo_path", "files"],
    },
  },
  {
    name: "git_reset",
    description: "Unstages all staged changes",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
      },
      required: ["repo_path"],
    },
  },
  {
    name: "git_log",
    description: "Shows the commit logs",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
        max_count: {
          type: "number", // JSON Schema uses 'number'
          description: "Maximum number of commits to show (default: 10)",
        },
      },
      required: ["repo_path"], // max_count is optional, so not in required
    },
  },
  {
    name: "git_create_branch",
    description: "Creates a new branch",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
        branch_name: {
          type: "string",
          description: "Name of the new branch",
        },
        start_point: {
          type: "string",
          description:
            "Starting point for the new branch (commit hash, branch name, etc.)",
        },
      },
      required: ["repo_path", "branch_name"], // start_point is optional
    },
  },
  {
    name: "git_checkout",
    description: "Switches branches or restores working tree files",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
        branch_name: {
          type: "string",
          description: "Name of branch to checkout",
        },
      },
      required: ["repo_path", "branch_name"],
    },
  },
  {
    name: "git_show",
    description: "Shows various types of objects (commits, tags, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
        revision: {
          type: "string",
          description: "The revision (commit hash, branch name, tag) to show",
        },
      },
      required: ["repo_path", "revision"],
    },
  },
  {
    name: "git_init",
    description: "Initializes a Git repository",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to directory to initialize git repo",
        },
      },
      required: ["repo_path"],
    },
  },
];
