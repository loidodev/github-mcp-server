import { Octokit } from "@octokit/rest";
import {
  CreateCommitParams,
  PushParams,
  PullParams,
  isValidCreateCommitArgs,
  isValidPushArgs,
  isValidPullArgs,
} from "../types.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { getGitConfigOwner } from "../utils.js";

interface Request<T = unknown> {
  method: string;
  params: {
    name: string;
    arguments?: unknown;
    _meta?: Record<string, unknown>;
  };
}

export class CommitHandlers {
  private octokit: InstanceType<typeof Octokit>;

  constructor(octokit: InstanceType<typeof Octokit>) {
    this.octokit = octokit;
  }

  /**
   * Helper method to detect the current branch of a repository
   * Falls back to "main" if detection fails
   */
  private async detectCurrentBranch(
    repo: string,
    owner: string
  ): Promise<string> {
    try {
      // Try to get the default branch from the repository information
      const { data: repoData } = await this.octokit.repos.get({
        owner,
        repo,
      });

      console.log(`Detected default branch: ${repoData.default_branch}`);
      return repoData.default_branch;
    } catch (error) {
      console.warn(
        `Failed to detect default branch: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      console.warn('Falling back to "main" branch');
      return "main";
    }
  }

  async handleCreateCommit(request: Request<CreateCommitParams>) {
    const args = request.params.arguments;
    if (!isValidCreateCommitArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid arguments for create_commit: requires repo, message, and files array"
      );
    }

    // Get owner from git config if not provided, fallback to authenticated user
    let owner = args.owner;
    if (!owner) {
      try {
        // Try to get from git config first
        const gitConfigOwner = getGitConfigOwner();
        if (gitConfigOwner) {
          owner = gitConfigOwner;
          console.log(`Using owner from git config: ${owner}`);
        } else {
          // Fallback to authenticated user
          const { data: user } = await this.octokit.users.getAuthenticated();
          owner = user.login;
          console.log(`Using authenticated GitHub user: ${owner}`);
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Failed to determine repository owner. Please provide owner explicitly."
        );
      }
    }

    // Determine which branch to use
    const branch =
      args.branch || (await this.detectCurrentBranch(args.repo, owner));
    console.log(`Using branch: ${branch}`);

    // Declare variables with proper types
    let refData: Awaited<ReturnType<typeof this.octokit.git.getRef>>["data"];
    let commitData: Awaited<
      ReturnType<typeof this.octokit.git.getCommit>
    >["data"];

    try {
      // Get the current commit SHA for the branch
      const { data: refResponse } = await this.octokit.git.getRef({
        owner,
        repo: args.repo,
        ref: `heads/${branch}`,
      });
      if (!refResponse?.object?.sha) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid reference data received for branch '${branch}'. The branch may not exist.`
        );
      }
      refData = refResponse;

      // Get the current tree SHA
      const { data: commitResponse } = await this.octokit.git.getCommit({
        owner,
        repo: args.repo,
        commit_sha: refData.object.sha,
      });
      if (!commitResponse?.tree?.sha) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid commit data received. Unable to access the commit tree.`
        );
      }
      commitData = commitResponse;
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidParams,
        `Failed to get branch reference: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please verify the repository and branch exist.`
      );
    }

    // Create blobs for each file
    let blobs;
    try {
      blobs = await Promise.all(
        args.files.map(async (file) => {
          console.log(`Creating blob for file: ${file.path}`);
          const { data } = await this.octokit.git.createBlob({
            owner,
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
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Failed to create file blobs: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Create a new tree
    let newTree: { sha: string; url: string; tree: Array<unknown> };
    let newCommit: {
      sha: string;
      url: string;
      tree: { sha: string; url: string };
    };

    try {
      if (!blobs || blobs.length === 0) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "No valid file blobs were created. Please check the file contents."
        );
      }

      // Create tree
      const treeResponse = await this.octokit.git.createTree({
        owner,
        repo: args.repo,
        base_tree: commitData.tree.sha,
        tree: blobs,
      });

      if (!treeResponse.data?.sha) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Failed to create a valid tree structure."
        );
      }
      newTree = treeResponse.data;
      console.log(`Created new tree with SHA: ${newTree.sha}`);

      // Create commit
      const commitResponse = await this.octokit.git.createCommit({
        owner,
        repo: args.repo,
        message: args.message,
        tree: newTree.sha,
        parents: [refData.object.sha],
      });

      if (!commitResponse.data?.sha) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Failed to create a valid commit. The commit data is invalid."
        );
      }

      newCommit = commitResponse.data;
      console.log(`Created new commit with SHA: ${newCommit.sha}`);
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Failed to create commit: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Update the branch reference
    try {
      await this.octokit.git.updateRef({
        owner,
        repo: args.repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });
      console.log(
        `Updated branch reference: ${branch} to commit ${newCommit.sha}`
      );
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Failed to update branch reference: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Prepare a more informative response
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "success",
              commit_sha: newCommit.sha,
              html_url: `https://github.com/${owner}/${args.repo}/commit/${newCommit.sha}`,
              repository: `${owner}/${args.repo}`,
              branch: branch,
              message: args.message,
              files_changed: args.files.length,
              file_paths: args.files.map((file) => file.path),
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async handlePush(request: Request) {
    const args = request.params.arguments ?? {};
    if (!isValidPushArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, "Invalid arguments for push");
    }

    // Get owner from git config if not provided, fallback to authenticated user
    let owner = args.owner;
    if (!owner) {
      // Try to get from git config first
      const gitConfigOwner = getGitConfigOwner();
      if (gitConfigOwner) {
        owner = gitConfigOwner;
        console.log(`Using owner from git config: ${owner}`);
      } else {
        // Fallback to authenticated user
        const { data: user } = await this.octokit.users.getAuthenticated();
        owner = user.login;
        console.log(`Using authenticated GitHub user: ${owner}`);
      }
    }

    // Determine which branch to use
    const branch =
      args.branch || (await this.detectCurrentBranch(args.repo, owner));
    console.log(`Using branch for push: ${branch}`);

    // In GitHub's API, push is implicit when you update references (like in create_commit)
    // So we'll just return success since the actual push happens during commit
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              message:
                "Push successful (changes are automatically pushed when commits are created)",
              repository: `${owner}/${args.repo}`,
              branch: branch,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async handlePull(request: Request<PullParams>) {
    const args = request.params.arguments;
    if (!isValidPullArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, "Invalid arguments for pull");
    }

    // Get owner from git config if not provided, fallback to authenticated user
    let owner = args.owner;
    if (!owner) {
      try {
        // Try to get from git config first
        const gitConfigOwner = getGitConfigOwner();
        if (gitConfigOwner) {
          owner = gitConfigOwner;
          console.log(`Using owner from git config: ${owner}`);
        } else {
          // Fallback to authenticated user
          const { data: user } = await this.octokit.users.getAuthenticated();
          owner = user.login;
          console.log(`Using authenticated GitHub user: ${owner}`);
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Failed to determine repository owner. Please provide owner explicitly."
        );
      }
    }

    // Determine which branch to use
    const branch =
      args.branch || (await this.detectCurrentBranch(args.repo, owner));
    console.log(`Using branch for pull: ${branch}`);

    try {
      // Get the latest commit for the branch
      const { data: commitData } = await this.octokit.repos.getCommit({
        owner,
        repo: args.repo,
        ref: branch,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                commit_sha: commitData.sha,
                html_url: commitData.html_url,
                message: commitData.commit.message,
                author: commitData.commit.author?.name,
                date: commitData.commit.author?.date,
                files_changed: commitData.files?.map((f) => f.filename) || [],
                repository: `${owner}/${args.repo}`,
                branch: branch,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Failed to pull from repository: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please verify the repository and branch exist.`
      );
    }
  }
}
