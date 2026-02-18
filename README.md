# AntAI

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

A visual GUI for Claude Code's experimental Agent Teams feature. Orchestrate, monitor, and manage teams of Claude Code CLI instances from an interactive canvas.

## Quick Start

```bash
# Install dependencies
bun install

# Initial setup (creates DB, seeds templates)
bun run setup

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Prerequisites

- [Bun](https://bun.sh) v1.x or [Node.js](https://nodejs.org) v20+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Enable Agent Teams: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Canvas | React Flow (@xyflow/react) |
| Terminal | xterm.js (@xterm/xterm) |
| Database | SQLite (better-sqlite3 + Drizzle ORM) |
| State | Zustand (client) + TanStack React Query (server) |
| Real-time | WebSocket (ws) |

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server with Turbopack |
| `bun run build` | Production build |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | ESLint |
| `bun run setup` | Initial project setup |
| `bun run db:push` | Push schema to SQLite |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run Drizzle migrations |

## Architecture

```
src/
  app/            Next.js pages + API routes
  components/     React components by feature
  lib/            Shared utils, DB, types
    claude/       CLI integration, process manager, output parser
    db/           Drizzle schema, queries, seed
    ws/           WebSocket protocol + room manager
  stores/         Zustand stores
  hooks/          Custom React hooks
  providers/      React context providers
server/           Custom Bun server with WebSocket
templates/        Built-in team template JSON files
```

The custom server wraps Next.js and adds WebSocket support on the `/ws` path. A `ProcessManager` singleton manages Claude CLI child processes, parsing their output into structured events broadcast over WebSocket channels.

## License

[Apache-2.0](LICENSE)
