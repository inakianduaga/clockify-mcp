# Product Requirement Document (PRD)

## Purpose

Enable LLMs (such as Cursor) to interact with Clockify for time-tracking automation and queries, via a secure, extensible MCP server.

## Core Requirements

- **Single-user support:** The server operates for the user whose Clockify API key is provided.
- **MCP protocol:** The server must implement the MCP protocol using the official SDK for compatibility with LLMs and tools like Cursor.
- **Clockify integration:**
  - List all projects for the authenticated user
  - List time entries for the authenticated user (with optional start/end date filters)
  - Add time entries to a project
  - List all users in the workspace
  - List time entries for any user (with optional date filters)
  - Get a summary report of hours by user/project for a date range (optionally filtered by userIds/projectIds)
- **Authentication:** API key is provided via MCP config and passed as an environment variable to the Docker container.
- **Deployment:**
  - **Primary:** Docker container (with a provided Dockerfile)
  - **Alternative:** Local Node.js/TypeScript (for development or advanced use)
- **Extensibility:**
  - Should be easy to add more Clockify features as new MCP tools

## Out of Scope

- Multi-user support (future extension)
- Database or persistent storage (all data comes from Clockify API)

## User Stories

- As a user, I want to list my Clockify projects from Cursor.
- As a user, I want to see my time entries, optionally filtered by date.
- As a user, I want to add a time entry to a project from Cursor.
- As a user, I want to list all users in my workspace.
- As a user, I want to pull timesheets for any user in my workspace, optionally filtered by date.
- As a user, I want to get a monthly or custom date range breakdown of hours by user and project.

## Acceptance Criteria

- The server exposes the six tools (listProjects, getTimeEntries, addTimeEntry, listUsers, getUserTimeEntries, getSummaryReport) via MCP.
- The server reads the API key from MCP config and authenticates all requests to Clockify.
- The server can be run as a Docker container (primary) or locally (alternative).
- The README documents API key setup, MCP config, and usage for both Docker and local workflows.
