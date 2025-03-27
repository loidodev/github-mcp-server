import { Octokit } from "@octokit/rest";
import { RepositoryHandlers } from "./repository-handlers.js";
import { CommitHandlers } from "./commit-handlers.js";
import { StatusHandlers } from "./status-handlers.js";

export class GitHubHandlers {
  private octokit: InstanceType<typeof Octokit>;
  private repositoryHandlers: RepositoryHandlers;
  private commitHandlers: CommitHandlers;
  private statusHandlers: StatusHandlers;

  constructor(githubToken: string) {
    this.octokit = new Octokit({ auth: githubToken });
    this.repositoryHandlers = new RepositoryHandlers(this.octokit);
    this.commitHandlers = new CommitHandlers(this.octokit);
    this.statusHandlers = new StatusHandlers(this.octokit);
  }

  async handleListUserRepos(request: any) {
    return this.repositoryHandlers.handleListUserRepos(request);
  }

  async handleGetRepo(request: any) {
    return this.repositoryHandlers.handleGetRepo(request);
  }

  async handleCreateRepo(request: any) {
    return this.repositoryHandlers.handleCreateRepo(request);
  }

  async handleCreateCommit(request: any) {
    return this.commitHandlers.handleCreateCommit(request);
  }

  async handlePush(request: any) {
    return this.commitHandlers.handlePush(request);
  }

  async handlePull(request: any) {
    return this.commitHandlers.handlePull(request);
  }

  async handleGitStatus(request: any) {
    return this.statusHandlers.handleGitStatus(request);
  }
}
