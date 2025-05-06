import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { listToolsHandler, callToolHandler } from "../src/handlers";

let fetchMock: Mock;

beforeEach(() => {
  vi.restoreAllMocks();
  fetchMock = vi.fn();
  global.fetch = fetchMock;
  process.env.CLOCKIFY_API_KEY = "dummy-key";
});

describe("MCP Server Tools", () => {
  it("should list available tools", async () => {
    const result = await listToolsHandler();
    const tools: Array<{ name: string }> = result.tools;
    expect(tools).toBeDefined();
    expect(tools.some((t) => t.name === "listProjects")).toBe(true);
    expect(tools.some((t) => t.name === "getTimeEntries")).toBe(true);
    expect(tools.some((t) => t.name === "addTimeEntry")).toBe(true);
    expect(tools.some((t) => t.name === "listUsers")).toBe(true);
    expect(tools.some((t) => t.name === "getUserTimeEntries")).toBe(true);
    expect(tools.some((t) => t.name === "getSummaryReport")).toBe(true);
  });

  it("should call listProjects tool and return mocked projects", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ activeWorkspace: "ws1", id: "user1" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "p1", name: "Project 1" }],
    });
    const result = await callToolHandler({
      params: { name: "listProjects", arguments: {} },
    });
    const projects: Array<{ id: string; name: string }> =
      result.content[0].json;
    expect(projects[0].name).toBe("Project 1");
  });

  it("should call getTimeEntries tool and return mocked entries", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ activeWorkspace: "ws1", id: "user1" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "te1", description: "Worked on X" }],
    });
    const result = await callToolHandler({
      params: { name: "getTimeEntries", arguments: {} },
    });
    const entries: Array<{ id: string; description: string }> =
      result.content[0].json;
    expect(entries[0].description).toBe("Worked on X");
  });

  it("should call addTimeEntry tool and return mocked entry", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ activeWorkspace: "ws1", id: "user1" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "te2", description: "Added entry" }),
    });
    const result = await callToolHandler({
      params: {
        name: "addTimeEntry",
        arguments: {
          projectId: "p1",
          description: "Added entry",
          start: "2024-01-01T00:00:00Z",
          end: "2024-01-01T01:00:00Z",
        },
      },
    });
    const entry: { id: string; description: string } = result.content[0].json;
    expect(entry.description).toBe("Added entry");
  });

  it("should call listUsers tool and return mocked users", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ activeWorkspace: "ws1", id: "user1" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "u1", name: "Alice" },
        { id: "u2", name: "Bob" },
      ],
    });
    const result = await callToolHandler({
      params: { name: "listUsers", arguments: {} },
    });
    const users: Array<{ id: string; name: string }> = result.content[0].json;
    expect(users.length).toBe(2);
    expect(users[0].name).toBe("Alice");
  });

  it("should call getUserTimeEntries tool and return mocked entries", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ activeWorkspace: "ws1", id: "user1" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "te1", description: "Worked on Project" }],
    });
    const result = await callToolHandler({
      params: {
        name: "getUserTimeEntries",
        arguments: { userId: "u1", start: "2024-01-01", end: "2024-01-31" },
      },
    });
    const entries: Array<{ id: string; description: string }> =
      result.content[0].json;
    expect(entries[0].description).toBe("Worked on Project");
  });

  it("should call getSummaryReport tool and return mocked summary", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ activeWorkspace: "ws1", id: "user1" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totals: [
          { userId: "u1", projectId: "p1", totalTime: 3600 },
          { userId: "u2", projectId: "p2", totalTime: 1800 },
        ],
      }),
    });
    const result = await callToolHandler({
      params: {
        name: "getSummaryReport",
        arguments: {
          start: "2024-01-01",
          end: "2024-01-31",
          userIds: ["u1", "u2"],
          projectIds: ["p1", "p2"],
        },
      },
    });
    const summary: {
      totals: Array<{ userId: string; projectId: string; totalTime: number }>;
    } = result.content[0].json;
    expect(summary.totals.length).toBe(2);
    expect(summary.totals[0].userId).toBe("u1");
    expect(summary.totals[1].totalTime).toBe(1800);
  });

  it("should call getUserTimeEntriesByName tool and return mocked entries", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ activeWorkspace: "ws1", id: "user1" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "u1", name: "Inaki Anduaga" },
        { id: "u2", name: "Bob" },
      ],
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "te1", description: "Worked on Project" },
      ],
    });
    const result = await callToolHandler({
      params: {
        name: "getUserTimeEntriesByName",
        arguments: { userName: "inaki anduaga", start: "2024-04-01", end: "2024-04-30" },
      },
    });
    const entries: Array<{ id: string; description: string }> = result.content[0].json;
    expect(entries[0].description).toBe("Worked on Project");
  });
});
