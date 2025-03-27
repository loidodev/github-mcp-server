# GitHub MCP Server

A Model Context Protocol server for interacting with the GitHub API.

## Features

### Tools

- `list_user_repos`: List repositories for the authenticated user

  - Parameters:
    - `type` (optional): "owner", "all", or "member" (default: "owner")
    - `sort` (optional): "created", "updated", "pushed", or "full_name" (default: "full_name")
    - `direction` (optional): "asc" or "desc" (default: "asc")
    - `per_page` (optional): Number of results per page (default: 30, max: 100)
    - `page` (optional): Page number (default: 1)

- `get_repo`: Get details about a specific repository

  - Parameters:
    - `repo` (required): The name of the repository
    - `owner` (optional): The account owner. If not provided, uses authenticated user.

- `create_repo`: Create a new repository

  - Parameters:
    - `name` (required): The name of the repository
    - `description` (optional): A short description
    - `private` (optional): Whether the repository is private (default: false)
    - `auto_init` (optional): Create initial commit with empty README (default: false)

- `create_commit`: Create a new commit with file changes

  - Parameters:
    - `repo` (required): The name of the repository
    - `owner` (optional): The account owner. If not provided, uses authenticated user.
    - `branch` (optional): The branch name (default: "main")
    - `message` (required): The commit message
    - `files` (required): Array of files to include in commit
      - Each file requires:
        - `path`: File path relative to repository root
        - `content`: File content

- `push`: Push changes to a remote repository

  - Parameters:
    - `repo` (required): The name of the repository
    - `owner` (optional): The account owner. If not provided, uses authenticated user.
    - `branch` (optional): The branch name (default: "main")

- `pull`: Pull changes from a remote repository
  - Parameters:
    - `repo` (required): The name of the repository
    - `owner` (optional): The account owner. If not provided, uses authenticated user.
    - `branch` (required): The branch name

## Requirements

- Node.js 18+
- GitHub personal access token with appropriate permissions
- Set `GITHUB_TOKEN` environment variable

## Installation

```bash
npm install
npm run build
```

## Configuration

Set your GitHub token as an environment variable:

```bash
export GITHUB_TOKEN=your_token_here
```

## Usage

Run the server:

```bash
npm start
```

## Development

For development with auto-rebuild:

```bash
npm run watch
```

## Debugging

Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npm run inspector
```
