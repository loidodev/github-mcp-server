import { Octokit } from "@octokit/rest";
import {
  GetRepoParams,
  ListUserReposParams,
  CreateRepoParams,
  isValidGetRepoArgs,
  isValidListUserReposArgs,
  isValidCreateRepoArgs,
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

export class RepositoryHandlers {
  private octokit: InstanceType<typeof Octokit>;

  constructor(octokit: InstanceType<typeof Octokit>) {
    this.octokit = octokit;
  }

  async handleListUserRepos(request: Request<ListUserReposParams>) {
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
          type: "text",
          text: JSON.stringify(repoData, null, 2),
        },
      ],
    };
  }

  async handleGetRepo(request: Request<unknown>) {
    const args = request.params.arguments;
    if (!isValidGetRepoArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid arguments for get_repo"
      );
    }
    const typedArgs = args as GetRepoParams;

    // Get owner from git config if not provided, fallback to authenticated user
    let owner = args.owner;
    if (!owner) {
      // Try to get from git config first
      const gitConfigOwner = getGitConfigOwner();
      if (gitConfigOwner) {
        owner = gitConfigOwner;
      } else {
        // Fallback to authenticated user
        const { data: user } = await this.octokit.users.getAuthenticated();
        owner = user.login;
      }
    }

    const response = await this.octokit.repos.get({ ...args, owner });
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
          type: "text",
          text: JSON.stringify(repoDetails, null, 2),
        },
      ],
    };
  }

  async handleCreateRepo(request: any) {
    const args = request.params.arguments;
    if (!isValidCreateRepoArgs(args)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid arguments for create_repo"
      );
    }

    // Get owner from git config if not provided, fallback to authenticated user
    let owner = args.owner;
    if (!owner) {
      // Try to get from git config first
      const gitConfigOwner = getGitConfigOwner();
      if (gitConfigOwner) {
        owner = gitConfigOwner;
      } else {
        // Fallback to authenticated user
        const { data: user } = await this.octokit.users.getAuthenticated();
        owner = user.login;
      }
    }

    const response = await this.octokit.repos.createForAuthenticatedUser({
      ...args,
      owner,
    });
    return {
      content: [
        {
          type: "text",
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
}
