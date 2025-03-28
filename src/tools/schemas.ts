import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolSchemas: Tool[] = [
  {
    name: "git_status",
    description: "Shows the working tree status",
    parameters: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
      },
      required: ["repo_path"],
    },
    returns: {
      type: "string",
      description: "Current status of working directory as text output",
    },
  },
  {
    name: "git_diff_unstaged",
    description: "Shows changes in working directory not yet staged",
    parameters: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
      },
      required: ["repo_path"],
    },
    returns: {
      type: "string",
      description: "Diff output of unstaged changes",
    },
  },
  {
    name: "git_diff_staged",
    description: "Shows changes that are staged for commit",
    parameters: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
      },
      required: ["repo_path"],
    },
    returns: {
      type: "string",
      description: "Diff output of staged changes",
    },
  },
  {
    name: "git_diff",
    description: "Shows differences between branches or commits",
    parameters: {
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
    returns: {
      type: "string",
      description: "Diff output comparing current state with target",
    },
  },
  {
    name: "git_commit",
    description: "Records changes to the repository",
    parameters: {
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
    returns: {
      type: "string",
      description: "Confirmation with new commit hash",
    },
  },
  {
    name: "git_add",
    description: "Adds file contents to the staging area",
    parameters: {
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
    returns: {
      type: "string",
      description: "Confirmation of staged files",
    },
  },
  {
    name: "git_reset",
    description: "Unstages all staged changes",
    parameters: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
      },
      required: ["repo_path"],
    },
    returns: {
      type: "string",
      description: "Confirmation of reset operation",
    },
  },
  {
    name: "git_log",
    description: "Shows the commit logs",
    parameters: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to Git repository",
        },
        max_count: {
          type: "number",
          description: "Maximum number of commits to show (default: 10)",
        },
      },
      required: ["repo_path"],
    },
    returns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          hash: {
            type: "string",
            description: "Commit hash",
          },
          author: {
            type: "string",
            description: "Author of the commit",
          },
          date: {
            type: "string",
            description: "Date of the commit",
          },
          message: {
            type: "string",
            description: "Commit message",
          },
        },
      },
      description:
        "Array of commit entries with hash, author, date, and message",
    },
  },
  {
    name: "git_create_branch",
    description: "Creates a new branch",
    parameters: {
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
          description: "Starting point for the new branch",
        },
      },
      required: ["repo_path", "branch_name"],
    },
    returns: {
      type: "string",
      description: "Confirmation of branch creation",
    },
  },
  {
    name: "git_checkout",
    description: "Switches branches",
    parameters: {
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
    returns: {
      type: "string",
      description: "Confirmation of branch switch",
    },
  },
  {
    name: "git_show",
    description: "Shows the contents of a commit",
    parameters: {
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
    returns: {
      type: "string",
      description: "Contents of the specified commit",
    },
  },
  {
    name: "git_init",
    description: "Initializes a Git repository",
    parameters: {
      type: "object",
      properties: {
        repo_path: {
          type: "string",
          description: "Path to directory to initialize git repo",
        },
      },
      required: ["repo_path"],
    },
    returns: {
      type: "string",
      description: "Confirmation of repository initialization",
    },
  },
];
