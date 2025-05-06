# Clockify MCP Server

Allow LLMs to interact with Clockify, to add & lookup times

## Quick Start (Docker)

The recommended way to run the Clockify MCP server is via Docker:

1. **Build the Docker image:**
   ```bash
   docker build -t clockify-mcp .
   ```
2. **Run the container (replace `YOUR_API_KEY`):**
   ```bash
   docker run -e CLOCKIFY_API_KEY=YOUR_API_KEY clockify-mcp
   ```

This will start the MCP server and make it available for integration with Cursor or other LLMs.

## Alternative: Run Locally (Node.js/TypeScript)

1. **Clone the repository:**
   ```bash
   git clone <this-repo-url>
   cd clockify-mcp
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the MCP server:**
   ```bash
   npx ts-node src/index.ts
   ```
   Or build and run:
   ```bash
   npm run build
   node build/index.js
   ```

## How to Obtain a Clockify API Key

1. Log in to your [Clockify account](https://clockify.me/login).
2. Click on your profile icon (top right) and select **Profile**.
3. Scroll down to the **API** section.
4. Click **Generate** if you don't have an API key, or copy your existing key.

## MCP Server Configuration for Cursor

Add the following to your Cursor `settings.json` (replace `YOUR_API_KEY`):

```json
{
  "mcpServers": {
    "clockify-mcp": {
      "command": "docker",
      "args": ["run", "-e", "CLOCKIFY_API_KEY=YOUR_API_KEY", "clockify-mcp"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Or, if running locally (see above), adjust the `command` and `args` accordingly.

## Features

- List all projects for the authenticated user
- List time entries for the authenticated user (with optional date filters)
- Add time entries to a project

## Memory Bank & Optimizations

See: https://github.com/Bhartendu-Kumar/rules_template
