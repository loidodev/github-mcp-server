import { Octokit } from "@octokit/rest";
import { GitStatusParams, isValidGitStatusArgs } from "../types.js";
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

export class StatusHandlers {
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

  async handleGitStatus(request: Request<GitStatusParams>) {
    const args = request.params.arguments;
    if (!isValidGitStatusArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid arguments for git_status"
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
    console.log(`Using branch for status: ${branch}`);

    try {
      // Get repository status
      const { data: repoData } = await this.octokit.repos.get({
        owner,
        repo: args.repo,
      });

      // Get latest commit
      const { data: commitData } = await this.octokit.repos.getCommit({
        owner,
        repo: args.repo,
        ref: branch,
      });

      // Get comparison with default branch
      const { data: comparison } = await this.octokit.repos.compareCommits({
        owner,
        repo: args.repo,
        base: repoData.default_branch,
        head: branch,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                repository: `${owner}/${args.repo}`,
                current_branch: branch,
                default_branch: repoData.default_branch,
                ahead_by: comparison.ahead_by,
                behind_by: comparison.behind_by,
                last_commit: {
                  sha: commitData.sha,
                  message: commitData.commit.message,
                  author: commitData.commit.author?.name,
                  date: commitData.commit.author?.date,
                },
                files_changed:
                  commitData.files?.map((f) => ({
                    filename: f.filename,
                    status: f.status,
                    changes: f.changes,
                    additions: f.additions,
                    deletions: f.deletions,
                  })) || [],
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
        `Failed to get repository status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
