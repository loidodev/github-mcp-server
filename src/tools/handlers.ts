import { execSync } from "child_process";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import * as path from "path";
import * as fs from "fs";

export class GitHubHandlers {
  constructor() {}

  /**
   * Validates that the repository path exists and is a git repository
   * @param repo_path Path to the git repository
   * @throws McpError if the path doesn't exist or is not a git repository
   */
  private validateRepoPath(repo_path: string): void {
    if (!fs.existsSync(repo_path)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Repository path does not exist: ${repo_path}`
      );
    }

    const gitDirPath = path.join(repo_path, ".git");
    if (!fs.existsSync(gitDirPath)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Not a git repository: ${repo_path}`
      );
    }
  }

  /**
   * Executes a git command in the specified repository
   * @param repo_path Path to the git repository
   * @param args Git command arguments
   * @returns The command output as a string
   * @throws McpError if the command fails
   */
  private executeGitCommand(repo_path: string, args: string[]): string {
    try {
      const command = ["git", ...args].join(" ");
      return execSync(command, {
        cwd: repo_path,
        encoding: "utf8",
      }).trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Git command failed: ${error.message}`
        );
      }
      throw new McpError(
        ErrorCode.InternalError,
        "Git command failed with unknown error"
      );
    }
  }

  /**
   * Shows the working tree status
   * @param repo_path Path to the git repository
   * @returns Current status of working directory as text output
   */
  gitStatus(repo_path: string): string {
    this.validateRepoPath(repo_path);
    return this.executeGitCommand(repo_path, ["status"]);
  }

  /**
   * Shows changes in working directory not yet staged
   * @param repo_path Path to the git repository
   * @returns Diff output of unstaged changes
   */
  gitDiffUnstaged(repo_path: string): string {
    this.validateRepoPath(repo_path);
    return this.executeGitCommand(repo_path, ["diff"]);
  }

  /**
   * Shows changes that are staged for commit
   * @param repo_path Path to the git repository
   * @returns Diff output of staged changes
   */
  gitDiffStaged(repo_path: string): string {
    this.validateRepoPath(repo_path);
    return this.executeGitCommand(repo_path, ["diff", "--staged"]);
  }

  /**
   * Shows differences between branches or commits
   * @param repo_path Path to the git repository
   * @param target Target branch or commit to compare with
   * @returns Diff output comparing current state with target
   */
  gitDiff(repo_path: string, target: string): string {
    this.validateRepoPath(repo_path);
    return this.executeGitCommand(repo_path, ["diff", target]);
  }

  /**
   * Records changes to the repository
   * @param repo_path Path to the git repository
   * @param message Commit message
   * @returns Confirmation with new commit hash
   */
  gitCommit(repo_path: string, message: string): string {
    this.validateRepoPath(repo_path);
    this.executeGitCommand(repo_path, ["commit", "-m", message]);
    // Get the hash of the new commit
    const hash = this.executeGitCommand(repo_path, ["rev-parse", "HEAD"]);
    return `Successfully committed changes with hash: ${hash}`;
  }

  /**
   * Adds file contents to the staging area
   * @param repo_path Path to the git repository
   * @param files Array of file paths to stage
   * @returns Confirmation of staged files
   */
  gitAdd(repo_path: string, files: string[]): string {
    this.validateRepoPath(repo_path);
    this.executeGitCommand(repo_path, ["add", ...files]);
    return `Successfully staged ${files.length} file(s): ${files.join(", ")}`;
  }

  /**
   * Unstages all staged changes
   * @param repo_path Path to the git repository
   * @returns Confirmation of reset operation
   */
  gitReset(repo_path: string): string {
    this.validateRepoPath(repo_path);
    this.executeGitCommand(repo_path, ["reset"]);
    return "Successfully unstaged all changes";
  }

  /**
   * Shows the commit logs
   * @param repo_path Path to the git repository
   * @param max_count Maximum number of commits to show (default: 10)
   * @returns Array of commit entries with hash, author, date, and message
   */
  gitLog(repo_path: string, max_count: number = 10): any[] {
    this.validateRepoPath(repo_path);
    const format = "%H|%an|%ad|%s";
    const output = this.executeGitCommand(repo_path, [
      "log",
      `-${max_count}`,
      `--pretty=format:${format}`,
    ]);

    if (!output) {
      return [];
    }

    return output.split("\n").map((line) => {
      const [hash, author, date, message] = line.split("|");
      return { hash, author, date, message };
    });
  }

  /**
   * Creates a new branch
   * @param repo_path Path to the git repository
   * @param branch_name Name of the new branch
   * @param start_point Starting point for the new branch (optional)
   * @returns Confirmation of branch creation
   */
  gitCreateBranch(
    repo_path: string,
    branch_name: string,
    start_point?: string
  ): string {
    this.validateRepoPath(repo_path);
    const args = ["branch", branch_name];
    if (start_point) {
      args.push(start_point);
    }
    this.executeGitCommand(repo_path, args);
    return `Successfully created branch: ${branch_name}`;
  }

  /**
   * Switches branches
   * @param repo_path Path to the git repository
   * @param branch_name Name of branch to checkout
   * @returns Confirmation of branch switch
   */
  gitCheckout(repo_path: string, branch_name: string): string {
    this.validateRepoPath(repo_path);
    this.executeGitCommand(repo_path, ["checkout", branch_name]);
    return `Successfully checked out branch: ${branch_name}`;
  }

  /**
   * Shows the contents of a commit
   * @param repo_path Path to the git repository
   * @param revision The revision (commit hash, branch name, tag) to show
   * @returns Contents of the specified commit
   */
  gitShow(repo_path: string, revision: string): string {
    this.validateRepoPath(repo_path);
    return this.executeGitCommand(repo_path, ["show", revision]);
  }

  /**
   * Initializes a Git repository
   * @param repo_path Path to directory to initialize git repo
   * @returns Confirmation of repository initialization
   */
  gitInit(repo_path: string): string {
    if (!fs.existsSync(repo_path)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Directory does not exist: ${repo_path}`
      );
    }

    this.executeGitCommand(repo_path, ["init"]);
    return `Successfully initialized git repository in ${repo_path}`;
  }
}
