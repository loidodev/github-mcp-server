import { execSync } from "child_process";

/**
 * Gets the GitHub username from local git config
 * @returns The GitHub username from git config or null if not found
 */
export function getGitConfigUser(): string | null {
  try {
    // Try to get user.name from git config
    const gitUser = execSync("git config --get user.name", {
      encoding: "utf8",
    }).trim();
    return gitUser || null;
  } catch (error) {
    console.error("Error getting git config user:", error);
    return null;
  }
}

/**
 * Gets the GitHub owner from local git config
 * Tries to get the owner from remote origin URL if available
 * @returns The GitHub owner from git config or null if not found
 */
export function getGitConfigOwner(): string | null {
  try {
    // First try to get the remote origin URL
    const remoteUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf8",
    }).trim();

    if (remoteUrl) {
      // Extract owner from GitHub URL formats:
      // https://github.com/owner/repo.git or git@github.com:owner/repo.git
      const httpsMatch = remoteUrl.match(/github\.com[\/:]([^\/]+)/);
      if (httpsMatch && httpsMatch[1]) {
        return httpsMatch[1];
      }
    }

    // Fallback to user.name if remote URL parsing failed
    return getGitConfigUser();
  } catch (error) {
    console.error("Error getting git config owner:", error);
    // Fallback to user.name
    return getGitConfigUser();
  }
}
