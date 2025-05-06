# Active Context

## Current Focus

- The MCP server for Clockify is implemented in TypeScript using the MCP SDK and native fetch.
- The server exposes three tools: listProjects, getTimeEntries, and addTimeEntry.
- It is designed for single-user use (the API key owner), with the API key provided via MCP config.
- The server is primarily deployed as a Docker container, with local Node.js as an alternative for development.
- All documentation (README, architecture, technical, PRD) is up to date with Docker as the main deployment method.

## Next Steps

- Add more Clockify features as needed (future work).
- Monitor for any issues or feature requests from LLM/Cursor integration.
