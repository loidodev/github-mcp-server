import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

export type ListUserReposParams =
  RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["parameters"];
export type GetRepoParams =
  RestEndpointMethodTypes["repos"]["get"]["parameters"];
export type CreateRepoParams =
  RestEndpointMethodTypes["repos"]["createForAuthenticatedUser"]["parameters"];
export type CreateCommitParams = {
  owner: string;
  repo: string;
  branch?: string;
  message: string;
  files: Array<{
    path: string;
    content: string;
  }>;
};
export type PushParams = {
  owner: string;
  repo: string;
  branch?: string;
};
export type PullParams = {
  owner: string;
  repo: string;
  branch: string;
};

export function isValidListUserReposArgs(
  args: any
): args is ListUserReposParams {
  return typeof args === "object" && args !== null;
}

export function isValidGetRepoArgs(args: any): args is GetRepoParams {
  return (
    typeof args === "object" && args !== null && typeof args.repo === "string"
  );
}

export function isValidCreateRepoArgs(args: any): args is CreateRepoParams {
  return (
    typeof args === "object" && args !== null && typeof args.name === "string"
  );
}

export function isValidCreateCommitArgs(args: any): args is CreateCommitParams {
  console.log(args);
  return (
    typeof args === "object" &&
    args !== null &&
    typeof args.repo === "string" &&
    typeof args.message === "string" &&
    Array.isArray(args.files) &&
    args.files.every(
      (file: any) =>
        typeof file.path === "string" && typeof file.content === "string"
    )
  );
}

export function isValidPushArgs(args: any): args is PushParams {
  return (
    typeof args === "object" && args !== null && typeof args.repo === "string"
  );
}

export function isValidPullArgs(args: any): args is PullParams {
  return (
    typeof args === "object" &&
    args !== null &&
    typeof args.repo === "string" &&
    typeof args.branch === "string"
  );
}

export type GitStatusParams = {
  owner?: string;
  repo: string;
  branch?: string;
};

export function isValidGitStatusArgs(args: any): args is GitStatusParams {
  return (
    typeof args === "object" && args !== null && typeof args.repo === "string"
  );
}
