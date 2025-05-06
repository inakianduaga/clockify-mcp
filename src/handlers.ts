import process from "node:process";

// Helper to get API key from MCP config
function getApiKey(): string {
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
    console.error(
      `[Error] Clockify API ${url} failed: ${response.status} ${text}`,
    );
    throw new Error(`Clockify API error: ${response.status} ${text}`);
  }
  return response.json();
}

// Handler for listing available tools
export async function listToolsHandler() {
  return {
    tools: [
      {
        name: "listProjects",
        description: "List all projects for the authenticated user.",
        inputSchema: { type: "object", properties: {}, required: [] },
      },
      {
        name: "getTimeEntries",
        description:
          "List time entries for the authenticated user. Optional: start, end (ISO8601).",
        inputSchema: {
          type: "object",
          properties: {
            start: {
              type: "string",
              description: "Start date (ISO8601, optional)",
            },
            end: {
              type: "string",
              description: "End date (ISO8601, optional)",
            },
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
            description: {
              type: "string",
              description: "Description of the time entry",
            },
            start: { type: "string", description: "Start time (ISO8601)" },
            end: { type: "string", description: "End time (ISO8601)" },
          },
          required: ["projectId", "description", "start", "end"],
        },
      },
      {
        name: "listUsers",
        description: "List all users in the workspace.",
        inputSchema: { type: "object", properties: {}, required: [] },
      },
      {
        name: "getUserTimeEntries",
        description:
          "List time entries for a specified user. Optional: start, end (ISO8601).",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "User ID" },
            start: {
              type: "string",
              description: "Start date (ISO8601, optional)",
            },
            end: {
              type: "string",
              description: "End date (ISO8601, optional)",
            },
          },
          required: ["userId"],
        },
      },
      {
        name: "getSummaryReport",
        description:
          "Get a summary report of hours by user/project for a date range. Optional: userIds, projectIds.",
        inputSchema: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date (ISO8601)" },
            end: { type: "string", description: "End date (ISO8601)" },
            userIds: {
              type: "array",
              items: { type: "string" },
              description: "Array of user IDs (optional)",
            },
            projectIds: {
              type: "array",
              items: { type: "string" },
              description: "Array of project IDs (optional)",
            },
          },
          required: ["start", "end"],
        },
      },
      {
        name: "getUserTimeEntriesByName",
        description:
          "List time entries for a user by name (case-insensitive, partial match allowed). Optional: start, end (ISO8601).",
        inputSchema: {
          type: "object",
          properties: {
            userName: {
              type: "string",
              description: "User name (partial/case-insensitive)",
            },
            start: {
              type: "string",
              description: "Start date (ISO8601, optional)",
            },
            end: {
              type: "string",
              description: "End date (ISO8601, optional)",
            },
          },
          required: ["userName"],
        },
      },
    ],
  };
}

interface MCPCallToolRequest {
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

// Handler for calling a tool
export async function callToolHandler(request: MCPCallToolRequest) {
  // Get user info (needed for workspace and userId)
  const user = await clockifyFetch("/user");
  const workspaceId = user.activeWorkspace;
  const userId = user.id;

  switch (request.params.name) {
    case "listProjects": {
      const projects = await clockifyFetch(
        `/workspaces/${workspaceId}/projects`,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(projects, null, 2),
          },
        ],
      };
    }
    case "getTimeEntries": {
      const { start, end } = request.params.arguments || {};
      let url = `/workspaces/${workspaceId}/user/${userId}/time-entries`;
      const params = [];
      if (typeof start === "string" && start)
        params.push(`start=${encodeURIComponent(start)}`);
      if (typeof end === "string" && end)
        params.push(`end=${encodeURIComponent(end)}`);
      if (params.length) url += `?${params.join("&")}`;
      const entries = await clockifyFetch(url);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(entries, null, 2),
          },
        ],
      };
    }
    case "addTimeEntry": {
      const { projectId, description, start, end } =
        request.params.arguments || {};
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
        },
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(entry, null, 2),
          },
        ],
      };
    }
    case "listUsers": {
      const users = await clockifyFetch(`/workspaces/${workspaceId}/users`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(users, null, 2),
          },
        ],
      };
    }
    case "getUserTimeEntries": {
      const {
        userId: targetUserId,
        start,
        end,
      } = request.params.arguments || {};
      if (!targetUserId) {
        throw new Error("userId is required");
      }
      let url = `/workspaces/${workspaceId}/user/${targetUserId}/time-entries`;
      const params = [];
      if (typeof start === "string" && start)
        params.push(`start=${encodeURIComponent(start)}`);
      if (typeof end === "string" && end)
        params.push(`end=${encodeURIComponent(end)}`);
      if (params.length) url += `?${params.join("&")}`;
      const entries = await clockifyFetch(url);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(entries, null, 2),
          },
        ],
      };
    }
    case "getSummaryReport": {
      const { start, end, userIds, projectIds } =
        request.params.arguments || {};
      if (!start || !end) {
        throw new Error("start and end are required");
      }
      const body = {
        dateRangeStart: start,
        dateRangeEnd: end,
        users: Array.isArray(userIds) ? userIds : undefined,
        projects: Array.isArray(projectIds) ? projectIds : undefined,
        summaryFilter: {},
        sortOrder: "ASCENDING",
        groups: ["USER", "PROJECT"],
      };
      const report = await clockifyFetch(
        `/workspaces/${workspaceId}/reports/summary`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    }
    case "getUserTimeEntriesByName": {
      const { userName, start, end } = request.params.arguments || {};
      if (!userName || typeof userName !== "string") {
        throw new Error("userName is required");
      }
      // Fetch users
      const users = await clockifyFetch(`/workspaces/${workspaceId}/users`);
      // Define a type for user
      type User = { id: string; name: string };
      // Find user by name (case-insensitive, partial match)
      const userMatch = (users as User[]).find(
        (u) => u.name && u.name.toLowerCase().includes(userName.toLowerCase()),
      );
      if (!userMatch) {
        throw new Error(`No user found matching name: ${userName}`);
      }
      let url = `/workspaces/${workspaceId}/user/${userMatch.id}/time-entries`;
      const params = [];
      if (typeof start === "string" && start)
        params.push(`start=${encodeURIComponent(start)}`);
      if (typeof end === "string" && end)
        params.push(`end=${encodeURIComponent(end)}`);
      if (params.length) url += `?${params.join("&")}`;
      const entries = await clockifyFetch(url);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(entries, null, 2),
          },
        ],
      };
    }
    default:
      throw new Error("Unknown tool");
  }
}

export { getApiKey, clockifyFetch };
