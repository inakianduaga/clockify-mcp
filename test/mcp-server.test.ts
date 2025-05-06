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
});
