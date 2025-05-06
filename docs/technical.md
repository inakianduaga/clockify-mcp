# Technical Documentation

## Tech Stack

- **Language:** TypeScript (Node.js)
- **MCP SDK:** @modelcontextprotocol/sdk
- **HTTP Client:** Native fetch (Node 18+)
- **Containerization:** Docker (primary deployment method)

## MCP Tools Implemented

- **listProjects:** Lists all projects for the authenticated user.
- **getTimeEntries:** Lists time entries for the authenticated user, with optional start/end date filters.
- **addTimeEntry:** Adds a time entry to a specified project.
- **listUsers:** Lists all users in the workspace. (Clockify: `/workspaces/{workspaceId}/users`)
- **getUserTimeEntries:** Lists time entries for a specified user, with optional date filters. (Clockify: `/workspaces/{workspaceId}/user/{userId}/time-entries`)
- **getSummaryReport:** Gets a summary report of hours by user/project for a date range, optionally filtered by userIds/projectIds. Uses the Clockify reports API (`/workspaces/{workspaceId}/reports/summary`).

## Authentication

- The Clockify API key is provided via MCP config (as `CLOCKIFY_API_KEY`).
- The API key is sent in the `X-Api-Key` header for all Clockify API requests.
- The API key is passed as an environment variable to the Docker container at runtime.

## Running the Server

- **Primary (Docker):**
  - Build: `docker build -t clockify-mcp .`
  - Run: `docker run -e CLOCKIFY_API_KEY=YOUR_API_KEY clockify-mcp`
- **Alternative (Local Node.js):**
  - Install dependencies: `npm install`
  - Run: `npx ts-node src/index.ts` or build and run with Node.js

## Dockerfile & Containerization

- The provided Dockerfile builds the TypeScript code and runs the server entry point.
- The container expects the API key as an environment variable.
- This approach ensures consistent, portable deployment across environments.

## Error Handling & Logging

- All API errors are logged to stderr with context.
- The server throws descriptive errors for missing config, failed API calls, or invalid tool arguments.

## Extensibility

- New Clockify features can be added as additional MCP tools.
- The code is modular and uses clear input/output schemas for each tool.
