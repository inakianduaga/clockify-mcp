#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import process from "node:process";

// Helper to get API key from MCP config
function getApiKey(): string {
  // MCP passes config as process.env for each server instance
  const apiKey = process.env.CLOCKIFY_API_KEY;
  if (!apiKey) {
    throw new Error("CLOCKIFY_API_KEY is not set in MCP config.");
  }
  return apiKey;
}

// Helper to call Clockify API
async function clockifyFetch(endpoint: string, options: RequestInit = {}) {
  const apiKey = getApiKey();
  const baseUrl = "https://api.clockify.me/api/v1";
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;
  const headers = {
    "X-Api-Key": apiKey,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[Error] Clockify API ${url} failed: ${response.status} ${text}`);
    throw new Error(`Clockify API error: ${response.status} ${text}`);
  }
  return response.json();
}

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: "clockify-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "listProjects",
        description: "List all projects for the authenticated user.",
        inputSchema: { type: "object", properties: {}, required: [] },
      },
      {
        name: "getTimeEntries",
        description: "List time entries for the authenticated user. Optional: start, end (ISO8601).",
        inputSchema: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date (ISO8601, optional)" },
            end: { type: "string", description: "End date (ISO8601, optional)" },
          },
          required: [],
        },
      },
      {
        name: "addTimeEntry",
        description: "Add a time entry to a project.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Clockify project ID" },
            description: { type: "string", description: "Description of the time entry" },
            start: { type: "string", description: "Start time (ISO8601)" },
            end: { type: "string", description: "End time (ISO8601)" },
          },
          required: ["projectId", "description", "start", "end"],
        },
      },
    ],
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Get user info (needed for workspace and userId)
  const user = await clockifyFetch("/user");
  const workspaceId = user.activeWorkspace;
  const userId = user.id;

  switch (request.params.name) {
    case "listProjects": {
      const projects = await clockifyFetch(`/workspaces/${workspaceId}/projects`);
      return {
        content: [
          {
            type: "json",
            json: projects,
          },
        ],
      };
    }
    case "getTimeEntries": {
      const { start, end } = request.params.arguments || {};
      let url = `/workspaces/${workspaceId}/user/${userId}/time-entries`;
      const params = [];
      if (typeof start === 'string' && start) params.push(`start=${encodeURIComponent(start)}`);
      if (typeof end === 'string' && end) params.push(`end=${encodeURIComponent(end)}`);
      if (params.length) url += `?${params.join("&")}`;
      const entries = await clockifyFetch(url);
      return {
        content: [
          {
            type: "json",
            json: entries,
          },
        ],
      };
    }
    case "addTimeEntry": {
      const { projectId, description, start, end } = request.params.arguments || {};
      if (!projectId || !description || !start || !end) {
        throw new Error("projectId, description, start, and end are required");
      }
      const body = {
        start,
        end,
        description,
        projectId,
      };
      const entry = await clockifyFetch(
        `/workspaces/${workspaceId}/time-entries`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      return {
        content: [
          {
            type: "json",
            json: entry,
          },
        ],
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  console.error("[Setup] Initializing Clockify MCP server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[Error] MCP server failed to start:", err);
  process.exit(1);
});
