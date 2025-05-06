# Architecture

## Overview

The Clockify MCP Server is a TypeScript-based server that exposes Clockify time-tracking functionality to LLMs (such as Cursor) via the MCP protocol. It uses the official MCP SDK and communicates with the Clockify API using native fetch. The server is designed for single-user use (the owner of the provided API key).

## Components

- **MCP Server (TypeScript, Node.js, Docker):** Implements the MCP protocol and exposes tools for interacting with Clockify. Runs primarily as a Docker container for portability and ease of deployment.
- **Clockify API:** The backend time-tracking service.
- **Cursor/LLM:** Consumes the MCP server tools to automate or query time-tracking data.

## Key Features

- List all projects for the authenticated user
- List time entries for the authenticated user (with optional date filters)
- Add time entries to a project
- List all users in the workspace
- List time entries for any user (with optional date filters)
- Get a summary report of hours by user/project for a date range (optionally filtered by userIds/projectIds)

## Authentication

- The Clockify API key is provided via MCP config (not as an environment variable or per-request parameter).

## Deployment

- **Primary:** Docker container (recommended for all environments)
- **Alternative:** Local Node.js/TypeScript (for development or advanced use)

## Containerization

- The server is distributed and run as a Docker image for consistency and ease of use. The Dockerfile builds the TypeScript code and runs the server entry point. The API key is passed as an environment variable at runtime.

## Data Flow

```mermaid
graph TD
    Cursor/LLM -->|MCP Protocol| DockerContainer[MCPServer (Docker)]
    DockerContainer -->|HTTP (fetch)| ClockifyAPI
```

## Extensibility

- Additional Clockify features can be added as new MCP tools.
- Multi-user support could be added by extending the authentication and tool logic.

## Notes

- The `getSummaryReport` tool uses the Clockify reports API for efficient aggregation of hours by user/project and time period, enabling monthly or custom breakdowns.
