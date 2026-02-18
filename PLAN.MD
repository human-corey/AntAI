AntAI Implementation Plan

 Context

 AntAI is an open source (Apache 2.0) GUI for Claude Code's experimental Agent Teams feature. It visualizes teams of Claude Code CLI instances working together, with a Railway-inspired UI and a mycelium/ant colony aesthetic. The app wraps the Claude Code CLI, spawning
 and managing processes via PTY, streaming output in real-time via WebSocket, and rendering the team topology on a React Flow canvas.

 This is a greenfield project — the directory C:/Users/User/Projects/AgentTeams is empty.

 Decisions Made

 ┌──────────────────┬─────────────────────────────────────────────────────────────────────────────────┐
 │     Decision     │                                     Choice                                      │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ App name         │ AntAI                                                                           │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ License          │ Apache 2.0                                                                      │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Package manager  │ bun                                                                             │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Framework        │ Next.js (App Router) + custom server for WebSocket                              │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ UI components    │ shadcn/ui + Tailwind CSS                                                        │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Canvas/graph     │ React Flow (@xyflow/react)                                                      │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Terminal         │ xterm.js + node-pty                                                             │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Real-time        │ WebSocket push (ws library)                                                     │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Database         │ SQLite (better-sqlite3 + drizzle-orm) + JSON                                    │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ State management │ Zustand (client) + TanStack React Query (server)                                │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Layout algorithm │ dagre (auto-layout with manual override)                                        │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Theme            │ Dark + light mode, mycelium/ant colony colors                                   │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Auth             │ None (local only, localhost)                                                    │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Process mgmt     │ node child_process via node-pty                                                 │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Agent detail     │ Right slide-out drawer with tabs (Terminal, Logs, Tasks, Chat)                  │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Task views       │ 3 modes: Kanban, side panel list, inline on canvas                              │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Navigation       │ Railway-style sidebar + top tabs (Canvas, Tasks, Logs, Settings)                │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Project model    │ User-defined groups, multiple concurrent teams per project                      │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Node design      │ Hybrid organic shape + card info                                                │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Edges            │ Animated particles when active, static when idle                                │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Notifications    │ Toast popups + activity feed panel                                              │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Templates        │ Full system (save/load/share/built-in starters)                                 │
 ├──────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Recovery         │ Persist state to SQLite, show last known on restart, resume via claude --resume │
 └──────────────────┴─────────────────────────────────────────────────────────────────────────────────┘

 Color Palette (Mycelium / AntAI)

 Dark mode:
   Background:  #121210  (dark earth)
   Card/Node:   #1a1a17  (slightly lighter earth)
   Border:      #2a2a25  (subtle earth border)
   Primary:     #d4a853  (warm gold)
   Secondary:   #2d6a4f  (forest green)
   Accent:      #f7b32b  (bright amber)
   Error:       #dc6b2f  (burnt orange)
   Muted text:  #8a8a7a  (earthy gray)
   Edge idle:   #6b6050  (earthy tan)
   Edge active: #d4a853  (warm gold particles)
   Glow:        #f7b32b40 (amber, 25% opacity)

 Light mode:
   Background:  #f5f3ef  (warm off-white)
   Card/Node:   #faf9f7  (near-white)
   Border:      #d9d5cc  (light earth border)
   Primary:     #d4a853  (warm gold)
   Secondary:   #2d6a4f  (forest green)
   Accent:      #f7b32b  (bright amber)
   Error:       #dc6b2f  (burnt orange)


 ---
 Phase 1: Project Scaffolding & Foundation [COMPLETE]

 Goal

 Set up the project with all tooling, base layout, theme, and database schema. A developer can run bun dev and see a themed shell with sidebar + routing.

 Tasks

 1. Initialize Next.js project with bun
   - bun create next-app with App Router, TypeScript, Tailwind, ESLint
   - Add bunfig.toml if needed
 2. Install core dependencies
   - shadcn/ui: bunx shadcn@latest init, add components (button, card, dialog, drawer, tabs, toast, badge, scroll-area, sheet, skeleton, switch, select, separator, input, dropdown-menu, tooltip)
   - React Flow: @xyflow/react
   - xterm.js: xterm, @xterm/addon-fit, @xterm/addon-web-links, @xterm/addon-search
   - node-pty: node-pty
   - WebSocket: ws, @types/ws
   - Database: better-sqlite3, @types/better-sqlite3, drizzle-orm, drizzle-kit
   - State: zustand, @tanstack/react-query
   - Utils: zod, nanoid, date-fns, sonner, next-themes, lucide-react, class-variance-authority, clsx, tailwind-merge
   - Layout: @dagrejs/dagre
 3. Set up AntAI theme (globals.css)
   - CSS custom properties for dark + light mode (mycelium palette)
   - Animation keyframes: glow-pulse, status-pulse, thinking-wave, particle-travel, node-appear
   - next-themes provider for dark/light toggle
 4. Create base layout structure
   - src/app/layout.tsx — root layout with ThemeProvider, sidebar, toast provider
   - src/components/layout/app-sidebar.tsx — Railway-style sidebar (logo, project nav, settings, theme toggle)
   - src/components/layout/theme-toggle.tsx — dark/light switch
   - src/app/projects/page.tsx — placeholder project list page
   - src/app/projects/[projectId]/layout.tsx — project layout with top tabs (Canvas, Tasks, Logs, Settings)
   - src/components/layout/project-tabs.tsx — top tab bar component
 5. Set up database schema (Drizzle ORM)
   - src/lib/db/schema.ts — all tables: projects, teams, agents, tasks, messages, logEntries, canvasLayouts, templates, activityLog, settings
   - src/lib/db/index.ts — DB client singleton (better-sqlite3 + drizzle)
   - drizzle.config.ts — config pointing to data/antai.db
   - Run initial migration
 6. Shared types and utilities
   - src/lib/types.ts — all TypeScript interfaces
   - src/lib/utils/id.ts — nanoid wrapper
   - src/lib/utils/paths.ts — Claude config path resolution (~/.claude/*)
   - src/lib/constants.ts — app-wide constants
 7. Project configuration files
   - LICENSE — Apache 2.0
   - README.md — project description, setup instructions
   - .env.local — CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
   - .gitignore — node_modules, data/, .next/, .env.local
   - CLAUDE.md — guidance for Claude Code working in this repo
 8. Setup script
   - scripts/setup.ts — check claude CLI exists, create data/ dir, run migrations, seed built-in templates

 Checkpoint: How to verify Phase 1 is complete

 # All must pass:
 bun dev                    # Server starts on localhost:3000
 # Browser shows: themed sidebar with "AntAI" logo, empty project list
 # Dark/light mode toggle works
 bun run db:generate        # Drizzle generates migration files
 bun run typecheck          # No TypeScript errors
 ls data/antai.db           # Database file exists


 Key files created

 package.json, tsconfig.json, next.config.ts, tailwind.config.ts
 drizzle.config.ts, bunfig.toml, LICENSE, README.md, CLAUDE.md
 .env.local, .gitignore
 src/app/layout.tsx, src/app/globals.css, src/app/page.tsx
 src/app/projects/page.tsx
 src/app/projects/[projectId]/layout.tsx
 src/app/projects/[projectId]/canvas/page.tsx (placeholder)
 src/app/projects/[projectId]/tasks/page.tsx (placeholder)
 src/app/projects/[projectId]/logs/page.tsx (placeholder)
 src/app/projects/[projectId]/settings/page.tsx (placeholder)
 src/components/layout/app-sidebar.tsx
 src/components/layout/project-tabs.tsx
 src/components/layout/theme-toggle.tsx
 src/components/ui/* (shadcn components)
 src/lib/db/schema.ts, src/lib/db/index.ts
 src/lib/types.ts, src/lib/constants.ts
 src/lib/utils/id.ts, src/lib/utils/paths.ts
 src/styles/animations.css
 scripts/setup.ts


 ---
 Phase 2: API Routes & Data Layer [COMPLETE]

 Goal

 Full CRUD API for projects, teams, agents, tasks, templates. Zustand stores and React Query hooks wired up. Frontend can fetch/mutate data.

 Tasks

 1. Zod validation schemas
   - src/lib/validation/projects.ts — createProjectSchema, updateProjectSchema
   - src/lib/validation/teams.ts — createTeamSchema, updateTeamSchema, startTeamSchema
   - src/lib/validation/tasks.ts — updateTaskSchema
   - src/lib/validation/templates.ts — createTemplateSchema, importTemplateSchema
   - src/lib/validation/settings.ts — updateSettingsSchema
 2. API routes (Next.js Route Handlers)
   - Projects: GET/POST /api/projects, GET/PATCH/DELETE /api/projects/[projectId]
   - Teams: GET/POST /api/projects/[projectId]/teams, GET/PATCH/DELETE .../teams/[teamId]
   - Team control: POST .../teams/[teamId]/start, POST .../teams/[teamId]/stop
   - Agents: GET .../teams/[teamId]/agents, GET .../agents/[agentId]
   - Agent control: POST .../agents/[agentId]/send, POST .../agents/[agentId]/resume, POST .../agents/[agentId]/kill
   - Tasks: GET /api/projects/[projectId]/tasks, GET/PATCH /api/tasks/[taskId]
   - Templates: GET/POST /api/templates, GET/PATCH/DELETE /api/templates/[templateId], POST /api/templates/import, GET /api/templates/export/[templateId]
   - System: GET /api/health, GET/PATCH /api/settings
   - Logs: GET /api/projects/[projectId]/logs
 3. Zustand stores
   - src/stores/ui-store.ts — sidebar, drawer, view mode, notification panel
   - src/stores/canvas-store.ts — React Flow nodes, edges, viewport, layout prefs
   - src/stores/agent-store.ts — live agent statuses, output buffers, thinking state
   - src/stores/notification-store.ts — toast queue, activity feed, unread count
   - src/stores/settings-store.ts — global settings (theme, paths, defaults)
 4. React Query setup
   - src/providers/query-provider.tsx — QueryClientProvider
   - src/lib/api/query-keys.ts — hierarchical query key factory
   - src/lib/api/hooks.ts — useProjects, useProject, useTeams, useTeam, useAgents, useTasks, useTemplates, useSettings hooks (queries + mutations)
 5. Seed built-in templates
   - templates/code-review-team.json
   - templates/research-team.json
   - templates/fullstack-team.json
   - src/lib/db/seed.ts — load built-in templates into DB on first run

 Checkpoint: How to verify Phase 2 is complete

 # API smoke tests (use curl or any HTTP client):
 curl http://localhost:3000/api/health          # Returns {ok: true, ...}
 curl http://localhost:3000/api/projects         # Returns [] (empty array)
 curl -X POST http://localhost:3000/api/projects \
   -H 'Content-Type: application/json' \
   -d '{"name":"Test","workingDir":"."}'        # Returns new project object
 curl http://localhost:3000/api/projects         # Returns [project]
 curl http://localhost:3000/api/templates        # Returns built-in templates
 bun run typecheck                              # No TypeScript errors


 Key files created

 src/lib/validation/*.ts (5 files)
 src/app/api/projects/route.ts
 src/app/api/projects/[projectId]/route.ts
 src/app/api/projects/[projectId]/teams/route.ts
 src/app/api/projects/[projectId]/teams/[teamId]/route.ts
 src/app/api/projects/[projectId]/teams/[teamId]/start/route.ts
 src/app/api/projects/[projectId]/teams/[teamId]/stop/route.ts
 src/app/api/projects/[projectId]/teams/[teamId]/agents/route.ts
 src/app/api/projects/[projectId]/teams/[teamId]/agents/[agentId]/route.ts
 src/app/api/projects/[projectId]/teams/[teamId]/agents/[agentId]/send/route.ts
 src/app/api/projects/[projectId]/teams/[teamId]/agents/[agentId]/resume/route.ts
 src/app/api/projects/[projectId]/teams/[teamId]/agents/[agentId]/kill/route.ts
 src/app/api/projects/[projectId]/tasks/route.ts
 src/app/api/projects/[projectId]/logs/route.ts
 src/app/api/tasks/[taskId]/route.ts
 src/app/api/templates/route.ts
 src/app/api/templates/[templateId]/route.ts
 src/app/api/templates/import/route.ts
 src/app/api/templates/export/[templateId]/route.ts
 src/app/api/health/route.ts
 src/app/api/settings/route.ts
 src/stores/*.ts (5 files)
 src/providers/query-provider.tsx
 src/lib/api/query-keys.ts
 src/lib/api/hooks.ts
 src/lib/db/seed.ts
 templates/*.json (3 files)


 ---
 Phase 3: WebSocket Server & Process Management [COMPLETE]

 Goal

 Custom server that wraps Next.js with WebSocket support. Can spawn Claude Code CLI as PTY child processes, stream output, and handle lifecycle. The server/index.ts replaces the default Next.js dev server.

 Tasks

 1. Custom server
   - server/index.ts — HTTP server + WebSocket upgrade on /ws path + Next.js request handler
   - Initialize singletons: DB, ProcessManager, FileWatcher, RoomManager
   - Graceful shutdown handlers (SIGTERM, SIGINT)
   - Update package.json scripts: dev and start point to server/index.ts
 2. WebSocket infrastructure
   - src/lib/ws/protocol.ts — ClientMessage / ServerMessage type definitions
   - src/lib/ws/rooms.ts — RoomManager: subscribe/unsubscribe clients to channels (project, team, agent, terminal, tasks, activity)
   - src/lib/ws/handlers.ts — handle client messages (subscribe, unsubscribe, terminal:input, terminal:resize, ping)
   - src/lib/ws/server.ts — setupWsHandlers: wire ws events to RoomManager
 3. PTY session management
   - src/lib/claude/pty-session.ts — PtySession class wrapping node-pty: spawn, write, resize, kill, onData, onExit
   - src/lib/claude/cli.ts — Claude CLI wrapper: build command args, check version, validate installation
   - src/lib/claude/process-manager.ts — ProcessManager singleton: spawnTeamLead, resumeAgent, sendInput, stopAgent, killAgent, stopTeam, shutdownAll
   - Store processes in Map<agentId, ManagedProcess>
 4. Output parsing
   - src/lib/claude/output-parser.ts — OutputParser: stateful line parser that strips ANSI and emits structured events (status_change, tool_use, tool_result, task_activity, agent_spawned, message, error, output_line)
 5. File watching
   - src/lib/claude/file-watcher.ts — ClaudeFileWatcher: watches ~/.claude/tasks/{teamId}/ and ~/.claude/teams/{teamName}/config.json with debounced callbacks
   - src/lib/claude/config-reader.ts — read/parse Claude team config and task files
 6. WebSocket client hook
   - src/hooks/use-websocket.ts — WebSocket connection hook with auto-reconnect (exponential backoff), subscribe/unsubscribe, message dispatch
   - src/providers/websocket-provider.tsx — Context provider that connects on mount, dispatches to Zustand stores + React Query
 7. Wire process events to WebSocket
   - PTY onData → broadcast to terminal:{agentId} room (raw) + OutputParser
   - OutputParser events → update DB + broadcast to agent:{agentId} room
   - FileWatcher changes → update DB + broadcast to tasks:{projectId} room
   - Process exit → update DB + broadcast agent:exited + create activity entry

 Checkpoint: How to verify Phase 3 is complete

 # Start custom server:
 bun dev                    # Server starts, logs "AntAI ready on http://localhost:3000"

 # WebSocket test (use wscat or browser console):
 wscat -c ws://localhost:3000/ws
 > {"type":"ping"}
 < {"type":"pong"}
 > {"type":"subscribe","channel":"activity","id":"global"}
 < {"type":"subscribed","channel":"activity","id":"global"}

 # Process test (if Claude CLI is available):
 curl -X POST http://localhost:3000/api/projects/test-proj/teams/test-team/start \
   -H 'Content-Type: application/json' \
   -d '{"prompt":"Hello"}'
 # Should see agent:spawned event on WebSocket
 # Terminal output should stream to terminal:{agentId} channel


 Key files created

 server/index.ts
 src/lib/ws/protocol.ts, rooms.ts, handlers.ts, server.ts
 src/lib/claude/pty-session.ts, cli.ts, process-manager.ts
 src/lib/claude/output-parser.ts, file-watcher.ts, config-reader.ts, types.ts
 src/hooks/use-websocket.ts
 src/providers/websocket-provider.tsx
 src/lib/utils/logger.ts, errors.ts, debounce.ts


 ---
 Phase 4: Project Management UI [COMPLETE]

 Goal

 Functional project list page with card grid, create/edit/delete projects, sidebar navigation. Users can manage projects and navigate between them.

 Tasks

 1. Project card component
   - src/components/projects/project-card.tsx — card showing name, description, agent count, team count, status badge, last activity timestamp
   - src/components/projects/project-mini-graph.tsx — tiny read-only React Flow preview on each card (shows a miniature of the team graph)
 2. Project grid page
   - src/components/projects/project-grid.tsx — responsive grid of project cards + "Create New" card
   - src/app/projects/page.tsx — full project list page using React Query useProjects() hook
   - Loading skeletons while fetching
 3. Create project dialog
   - src/components/projects/create-project-dialog.tsx — modal with form: name, description, working directory (with folder picker or text input)
   - Validates input with Zod, calls useCreateProject mutation
 4. Sidebar project navigation
   - Update app-sidebar.tsx to list projects from API
   - Active project highlighted
   - Click project → navigate to /projects/[id]/canvas
 5. Project settings page
   - src/app/projects/[projectId]/settings/page.tsx — edit name/description/workingDir, danger zone (delete)
 6. Shared components
   - src/components/shared/status-badge.tsx — colored badge for project/team/agent/task status
   - src/components/shared/empty-state.tsx — illustrated empty states ("No projects yet", etc.)
   - src/components/shared/loading-skeleton.tsx — skeleton loaders
   - src/components/shared/confirm-dialog.tsx — generic confirmation modal

 Checkpoint: How to verify Phase 4 is complete

 # In browser at localhost:3000:
 1. See empty project list with "Create New Project" card
 2. Click create → dialog opens → fill form → submit → card appears in grid
 3. Sidebar shows new project
 4. Click project card → navigates to /projects/[id]/canvas (placeholder for now)
 5. Top tabs visible (Canvas, Tasks, Logs, Settings)
 6. Settings tab → can edit project name → can delete project
 7. Dark/light mode works on all new components


 Key files created

 src/components/projects/project-card.tsx
 src/components/projects/project-grid.tsx
 src/components/projects/project-mini-graph.tsx
 src/components/projects/create-project-dialog.tsx
 src/components/shared/status-badge.tsx
 src/components/shared/empty-state.tsx
 src/components/shared/loading-skeleton.tsx
 src/components/shared/confirm-dialog.tsx
 Updated: src/components/layout/app-sidebar.tsx
 Updated: src/app/projects/page.tsx
 Updated: src/app/projects/[projectId]/settings/page.tsx


 ---
 Phase 5: Canvas & Agent Graph [COMPLETE]

 Goal

 React Flow canvas rendering agent nodes as organic-shaped cards connected by tunnel-like edges. Auto-layout with dagre. Multiple team clusters. Minimap and controls.

 Tasks

 1. React Flow canvas container
   - src/components/canvas/team-canvas.tsx — ReactFlowProvider, ReactFlow component, background, event handlers (node click, edge click, viewport change)
 2. Custom agent node
   - src/components/canvas/agent-node.tsx — organic border (rounded with subtle asymmetry via CSS border-radius), status glow ring, header (name + role badge), body (current task + last output preview), footer (model + uptime). Expandable/collapsible.
   - src/components/canvas/agent-node-compact.tsx — collapsed variant: just name + status dot
   - src/components/canvas/team-lead-node.tsx — lead variant: slightly larger, different shape/color
 3. Custom tunnel edge
   - src/components/canvas/tunnel-edge.tsx — earthy tan bezier curve, dashed when idle
   - src/components/canvas/animated-particles.tsx — SVG particles that travel along edge path when active. Uses <animateMotion> or CSS offset-path.
 4. Team clustering
   - src/components/canvas/team-cluster.tsx — visual boundary/background around nodes belonging to the same team. Subtle border + label.
 5. Auto-layout
   - src/hooks/use-auto-layout.ts — dagre layout: lead at top, teammates below. Respects manual overrides (positions stored in canvasLayouts table).
 6. Canvas controls
   - src/components/canvas/canvas-controls.tsx — re-layout button, zoom in/out, fit view, minimap toggle, auto-layout toggle
   - src/components/canvas/canvas-minimap.tsx — styled minimap
 7. Canvas page wiring
   - src/app/projects/[projectId]/canvas/page.tsx — fetch teams + agents for project, convert to React Flow nodes/edges, render TeamCanvas
   - Subscribe to WebSocket project:{id} channel for live updates
   - New agents → auto-add nodes with animation
   - Agent status changes → update node glow/status
 8. Canvas state persistence
   - Save node positions to canvasLayouts table on drag end
   - Load saved layout on page load
   - Re-layout button resets to auto-layout (with confirmation if manual positions exist)

 Checkpoint: How to verify Phase 5 is complete

 # In browser at localhost:3000/projects/[id]/canvas:
 1. Canvas renders with background grid/dots
 2. If team has agents: organic-shaped nodes visible with status info
 3. Edges connect lead to teammates (tunnel aesthetic)
 4. Nodes are draggable, positions persist on reload
 5. Auto-layout button arranges nodes hierarchically
 6. Minimap visible (toggleable)
 7. Zoom/pan works smoothly
 8. Clicking a node highlights it (drawer integration in Phase 6)
 9. Team clusters group nodes visually
 10. Dark/light mode themes canvas correctly

 # Test with mock data if no real agents available:
 # Seed DB with test agents and verify rendering


 Key files created

 src/components/canvas/team-canvas.tsx
 src/components/canvas/agent-node.tsx
 src/components/canvas/agent-node-compact.tsx
 src/components/canvas/team-lead-node.tsx
 src/components/canvas/tunnel-edge.tsx
 src/components/canvas/animated-particles.tsx
 src/components/canvas/team-cluster.tsx
 src/components/canvas/canvas-controls.tsx
 src/components/canvas/canvas-minimap.tsx
 src/hooks/use-auto-layout.ts
 Updated: src/app/projects/[projectId]/canvas/page.tsx
 Updated: src/stores/canvas-store.ts


 ---
 Phase 6: Agent Detail Drawer & Terminal [COMPLETE]

 Goal

 Click an agent node → right slide-out drawer opens with tabs: Terminal (xterm.js), Logs, Tasks, Chat. Full bidirectional terminal with the agent's PTY session.

 Tasks

 1. Agent drawer shell
   - src/components/agent-detail/agent-drawer.tsx — shadcn Sheet (right side), resizable width, tabs for Terminal/Logs/Tasks/Chat
   - src/components/agent-detail/agent-header.tsx — agent name, status badge, role, model, uptime, stop/resume buttons
 2. Terminal tab (xterm.js)
   - src/components/agent-detail/agent-terminal.tsx — xterm.js Terminal instance, mycelium theme (dark earth bg, gold text accents)
   - src/hooks/use-terminal.ts — manages xterm lifecycle: create, mount, connect to WebSocket terminal:{agentId}, handle resize, cleanup
   - Subscribe to terminal:{agentId} WebSocket channel on mount
   - Write incoming terminal:output directly to xterm.js (raw bytes)
   - Capture keystrokes → send as terminal:input WebSocket messages
   - @xterm/addon-fit for responsive sizing
   - @xterm/addon-web-links for clickable URLs
   - @xterm/addon-search for in-terminal search
   - src/styles/terminal.css — xterm.js custom styling
 3. Logs tab
   - src/components/agent-detail/agent-logs.tsx — virtualized scrolling log list, filtered to this agent
   - Level badges (info/warn/error/tool_use), timestamps, expandable entries
   - Filter bar: log level dropdown, text search
 4. Tasks tab
   - src/components/agent-detail/agent-tasks.tsx — list of tasks assigned to this agent, with status badges and progress
 5. Chat tab
   - src/components/agent-detail/agent-chat.tsx — chat-like view of messages sent to/from this agent
   - Input box at bottom to send a message to the agent (via terminal:input or agent messaging)
 6. Wire drawer to canvas
   - Click agent node → uiStore.openDrawer(agentId) → drawer opens
   - Canvas shrinks to accommodate drawer
   - Escape key or click outside → close drawer
   - Drawer AgentId syncs with canvas selected node highlight

 Checkpoint: How to verify Phase 6 is complete

 # In browser on canvas page:
 1. Click an agent node → drawer slides out from right
 2. Canvas shrinks to make room
 3. Drawer shows agent header with name, status, model
 4. Terminal tab: xterm.js renders with mycelium theme
 5. If agent is running: terminal shows live output, keystrokes send input
 6. Logs tab: shows log entries for this agent
 7. Tasks tab: shows assigned tasks
 8. Chat tab: shows message history
 9. Escape closes drawer, canvas expands back
 10. Drawer is resizable by dragging left edge


 Key files created

 src/components/agent-detail/agent-drawer.tsx
 src/components/agent-detail/agent-header.tsx
 src/components/agent-detail/agent-terminal.tsx
 src/components/agent-detail/agent-logs.tsx
 src/components/agent-detail/agent-tasks.tsx
 src/components/agent-detail/agent-chat.tsx
 src/hooks/use-terminal.ts
 src/styles/terminal.css


 ---
 Phase 7: Team Control (Create, Start, Stop, Monitor) [COMPLETE]

 Goal

 Users can create teams within projects, start them (which spawns the Claude Code CLI lead), see agents appear on the canvas in real-time, send messages, and stop teams.

 Tasks

 1. Create team UI
   - Dialog/modal to create a new team: name, description, optional template selection
   - "Start from template" dropdown that populates config from template
   - Initial prompt textarea (sent to the lead on startup)
 2. Start team flow
   - "Start Team" button on canvas or team settings
   - Calls POST /api/.../teams/[teamId]/start with prompt
   - Backend spawns Claude CLI via ProcessManager
   - WebSocket broadcasts team:status = starting → running
   - Lead agent node appears on canvas with spawn animation
 3. Live agent discovery
   - FileWatcher detects new members in ~/.claude/teams/{name}/config.json
   - Creates Agent DB records
   - Broadcasts team:agent_added via WebSocket
   - Canvas auto-adds new node with node-appear animation
   - Edge created from lead to new teammate
 4. Stop team flow
   - "Stop Team" button with confirmation dialog
   - Calls POST /api/.../teams/[teamId]/stop
   - Backend sends graceful shutdown → SIGTERM → SIGKILL cascade
   - Agent statuses transition: running → stopping → stopped
   - Canvas nodes show stopped state (dimmed, no glow)
 5. Agent status indicators on canvas
   - Wire WebSocket agent:status events to canvas node updates
   - Status dot colors: running=green, thinking=amber-pulse, tool_use=blue, error=burnt-orange, idle=gray, stopped=dark-gray
   - Current task text updates live on node
   - Last output preview updates live (2-3 lines)
 6. Edge animations
   - Wire WebSocket message:sent / message:received to edge state
   - When message detected between two agents → activate that edge's particle animation
   - Particles flow in direction of message
   - Animation fades after 3 seconds of no messages
 7. Agent actions
   - Resume button (calls POST .../agents/[agentId]/resume)
   - Force kill button (with confirmation, calls POST .../agents/[agentId]/kill)

 Checkpoint: How to verify Phase 7 is complete

 # Requires Claude Code CLI installed with agent teams enabled:
 1. Create a project, create a team within it
 2. Click "Start Team" with a prompt like "Create a team to investigate X"
 3. Lead agent node appears on canvas, glowing amber/green
 4. As lead spawns teammates, new nodes appear with animation
 5. Edges appear connecting lead to teammates
 6. Agent nodes show live status (thinking, tool_use, etc.)
 7. When agents message each other, edge particles animate
 8. Click an agent → drawer opens → terminal shows live output
 9. Click "Stop Team" → agents stop → nodes dim
 10. Team status in sidebar shows "Stopped"


 Key files created

 src/components/canvas/create-team-dialog.tsx
 src/components/canvas/start-team-button.tsx
 src/components/canvas/agent-actions-menu.tsx
 Updated: src/components/canvas/team-canvas.tsx (live updates)
 Updated: src/components/canvas/agent-node.tsx (status indicators)
 Updated: src/components/canvas/tunnel-edge.tsx (animation triggers)
 Updated: src/lib/claude/process-manager.ts (full implementation)
 Updated: src/lib/claude/file-watcher.ts (agent discovery)
 Updated: src/lib/ws/handlers.ts (agent/team events)


 ---
 Phase 8: Task Board [COMPLETE]

 Goal

 Three task view modes: Kanban columns, side panel list, inline on canvas nodes. All update in real-time via WebSocket.

 Tasks

 1. View mode toggle
   - src/components/tasks/view-mode-toggle.tsx — toggle between kanban/list/inline icons
 2. Kanban board
   - src/components/tasks/task-board.tsx — three columns: Pending, In Progress, Completed
   - src/components/tasks/task-column.tsx — column container with count badge
   - src/components/tasks/task-card.tsx — card: subject, assigned agent avatar/name, status, dependency indicators, blocked state
 3. Side panel list
   - src/components/tasks/task-list.tsx — table/list view with sortable columns (status, agent, created, subject)
   - src/components/tasks/task-filters.tsx — filter by team, agent, status
 4. Inline on canvas
   - src/components/tasks/task-inline.tsx — compact task list rendered inside agent nodes on the canvas
   - Update agent-node.tsx to optionally show inline tasks when view mode is "inline"
 5. Task detail dialog
   - src/components/tasks/task-detail-dialog.tsx — click a task card → modal with full details, description, dependencies, assigned agent, status history
 6. Tasks page
   - src/app/projects/[projectId]/tasks/page.tsx — full page with view mode toggle, filters, and the active view (kanban/list)
 7. Real-time task updates
   - Subscribe to tasks:{projectId} WebSocket channel
   - task:created → card appears in Pending column
   - task:updated → card moves between columns / updates status
   - task:completed → card moves to Completed with animation

 Checkpoint: How to verify Phase 8 is complete

 # On the Tasks tab of a project with a running team:
 1. Tasks appear in kanban columns (Pending, In Progress, Completed)
 2. Toggle to list view → tasks in a sortable table
 3. Toggle to inline → tasks appear inside agent nodes on canvas
 4. Filter by team or agent → list filters correctly
 5. As agents complete tasks, cards move between columns in real-time
 6. Click a task card → detail dialog opens
 7. Blocked tasks show dependency indicator
 8. Task count badges on columns update live


 Key files created

 src/components/tasks/view-mode-toggle.tsx
 src/components/tasks/task-board.tsx
 src/components/tasks/task-column.tsx
 src/components/tasks/task-card.tsx
 src/components/tasks/task-list.tsx
 src/components/tasks/task-filters.tsx
 src/components/tasks/task-inline.tsx
 src/components/tasks/task-detail-dialog.tsx
 Updated: src/app/projects/[projectId]/tasks/page.tsx
 Updated: src/components/canvas/agent-node.tsx (inline task support)


 ---
 Phase 9: Notifications & Activity Feed [COMPLETE]

 Goal

 Toast notifications for real-time events. Scrollable activity feed panel with full event history. Filterable and searchable.

 Tasks

 1. Toast notification system
   - src/components/notifications/toast-provider.tsx — Sonner toast container, positioned bottom-right
   - Wire WebSocket events to toasts: agent errors (destructive), task completions (success), agent spawned (info)
   - src/hooks/use-notification.ts — hook to trigger toasts programmatically
 2. Activity feed panel
   - src/components/notifications/activity-feed.tsx — toggleable right-side panel (separate from agent drawer), virtual-scrolled
   - src/components/notifications/activity-item.tsx — single entry: icon, title, detail, timestamp, severity color
   - src/components/layout/notification-feed.tsx — wrapper with header, unread count badge, mark-all-read button, filter bar
 3. Activity feed data
   - Populate activityLog table from: process events, file watcher changes, parsed output events
   - API: GET /api/projects/[projectId]/logs with pagination + filters
   - React Query hook for infinite scroll loading
 4. Notification bell in project header
   - Unread count badge on bell icon in project layout
   - Click → toggle activity feed panel
 5. Logs page
   - src/app/projects/[projectId]/logs/page.tsx — full page log viewer with filters (level, agent, time range), virtual scrolling

 Checkpoint: How to verify Phase 9 is complete

 1. Start a team → toast appears "Team started"
 2. Agent errors → red toast appears with error message
 3. Task completed → green toast appears
 4. Click notification bell → activity feed panel opens
 5. Feed shows chronological history of all events
 6. Unread count badge decrements as you view
 7. Filter activity by agent or event type
 8. Logs tab shows detailed, filterable log entries
 9. Toasts auto-dismiss after 5 seconds


 Key files created

 src/components/notifications/toast-provider.tsx
 src/components/notifications/activity-feed.tsx
 src/components/notifications/activity-item.tsx
 src/components/layout/notification-feed.tsx
 src/hooks/use-notification.ts
 Updated: src/app/projects/[projectId]/logs/page.tsx
 Updated: src/app/projects/[projectId]/layout.tsx (notification bell)
 Updated: src/providers/websocket-provider.tsx (toast triggers)


 ---
 Phase 10: Templates & Team History [COMPLETE]

 Goal

 Full template system: save team configs, browse gallery, import/export JSON, built-in starters. Team history showing past runs.

 Tasks

 1. Template gallery
   - src/app/templates/page.tsx — browsable gallery
   - src/components/templates/template-gallery.tsx — grid of template cards
   - src/components/templates/template-card.tsx — preview card: name, description, member count, tags, "Use" button
 2. Template editor
   - src/components/templates/template-editor.tsx — form to create/edit: team name, members (add/remove, name, role, model, system prompt), initial tasks
   - src/components/templates/template-preview.tsx — preview what the template will create (mini graph)
 3. Save as template
   - "Save as Template" button on running/stopped teams
   - Captures current team config (members, roles, models) as template
 4. Import/export
   - src/components/templates/template-import.tsx — file drop zone for JSON import
   - Export button downloads template as .json file
 5. Built-in starters
   - Seed DB with built-in templates on first run (code-review, research, fullstack, solo-agent)
   - Mark as isBuiltIn: true (non-deletable)
 6. Team history
   - Project settings or dedicated section: list of past team runs
   - Each entry: team name, start/stop time, agent count, task completion stats
   - "Re-run" button creates new team from same config

 Checkpoint: How to verify Phase 10 is complete

 1. Navigate to /templates → see built-in templates
 2. Click "Use" on a template → creates a new team in selected project
 3. Create custom template via editor → appears in gallery
 4. Export template → JSON file downloads
 5. Import JSON file → template appears in gallery
 6. On a running team, click "Save as Template" → saved
 7. In project settings, see history of past team runs
 8. Click "Re-run" on a past team → new team created with same config


 Key files created

 src/app/templates/page.tsx
 src/components/templates/template-gallery.tsx
 src/components/templates/template-card.tsx
 src/components/templates/template-editor.tsx
 src/components/templates/template-import.tsx
 src/components/templates/template-preview.tsx
 Updated: src/components/canvas/team-canvas.tsx (save as template)
 Updated: src/app/projects/[projectId]/settings/page.tsx (team history)


 ---
 Phase 11: Polish, Recovery & Open Source Prep [COMPLETE]

 Goal

 Finalize all animations, error handling, recovery logic, responsive layout, keyboard shortcuts, and prepare for open source release.

 Tasks

 1. Recovery on restart
   - On server startup: check DB for agents with status: running
   - For each, check if PID is alive → attempt re-attach via --resume
   - If dead → update status to crashed, show recovery options in UI
   - "Resume" button on crashed agents
 2. Error boundaries
   - src/components/shared/error-boundary.tsx — wrap canvas, drawer tabs, task board
   - Graceful fallbacks with "Reload" buttons
 3. Keyboard shortcuts
   - src/hooks/use-keyboard-shortcuts.ts — Escape (close drawer), Ctrl+K (command palette?), Ctrl+N (new project), etc.
 4. Responsive layout
   - Sidebar collapsible on small screens
   - Drawer adjusts width
   - Canvas fills available space
 5. Animation polish
   - Node appear/disappear transitions
   - Edge activation/deactivation smooth transitions
   - Drawer open/close animations
   - Kanban card movement animations
   - Loading states and skeleton shimmer
 6. Performance optimization
   - React.memo on AgentNode, TunnelEdge, TaskCard
   - Terminal output buffering (flush at 60fps)
   - Virtual scrolling on logs and activity feed
   - SQLite WAL mode enabled
   - Log retention auto-prune
 7. Open source preparation
   - README.md with: description, screenshots, features, installation, usage, architecture overview, contributing
   - CONTRIBUTING.md — how to contribute
   - CLAUDE.md — guidance for AI assistants working in the repo
   - .github/ — issue templates, PR template
   - Verify Apache 2.0 license headers
 8. Setup experience
   - bun run setup — checks Claude CLI, creates DB, runs migrations, seeds templates
   - First-run onboarding: if no projects exist, show welcome screen with quick-start guide

 Checkpoint: How to verify Phase 11 is complete

 1. Stop and restart the server → previously running agents show "crashed" with resume option
 2. Click "Resume" on crashed agent → reconnects to session
 3. Keyboard shortcuts work (Escape closes drawer, etc.)
 4. Collapse sidebar → canvas fills full width
 5. All animations smooth (node appear, edge particles, drawer slide)
 6. No React errors in console
 7. bun run typecheck passes
 8. README has screenshots and clear setup instructions
 9. Fresh clone + bun install + bun run setup + bun dev → working app


 Key files created/updated

 src/components/shared/error-boundary.tsx
 src/hooks/use-keyboard-shortcuts.ts
 CONTRIBUTING.md
 Updated: README.md (full documentation)
 Updated: CLAUDE.md (repo guidance)
 Updated: server/index.ts (recovery logic)
 Updated: src/lib/claude/process-manager.ts (resume/recovery)
 Updated: all components (React.memo, animations, error boundaries)
 .github/ISSUE_TEMPLATE/bug_report.md
 .github/ISSUE_TEMPLATE/feature_request.md
 .github/pull_request_template.md


 ---
 Architecture Summary

 Browser (localhost:3000)
   |
   |-- HTTP requests → Next.js API Routes → SQLite (drizzle-orm)
   |
   |-- WebSocket (ws://localhost:3000/ws)
   |     |
   |     |-- subscribe to channels (project, team, agent, terminal, tasks, activity)
   |     |-- receive: agent status, terminal output, task updates, activity events
   |     |-- send: terminal input, terminal resize, ping
   |
   v
 Custom Bun Server (server/index.ts)
   |
   |-- Next.js request handler (HTTP)
   |-- WebSocket server (ws)
   |-- ProcessManager singleton
   |     |-- Map<agentId, ManagedProcess>
   |     |-- PtySession per agent (node-pty)
   |     |     |-- onData → raw to WebSocket + OutputParser
   |     |     |-- onExit → update DB, broadcast, activity
   |     |-- OutputParser per agent
   |           |-- structured events → DB + WebSocket broadcast
   |
   |-- ClaudeFileWatcher singleton
   |     |-- fs.watch ~/.claude/tasks/{teamId}/ → task sync
   |     |-- fs.watch ~/.claude/teams/{name}/config.json → agent discovery
   |
   |-- SQLite DB (data/antai.db)
         |-- projects, teams, agents, tasks, messages
         |-- logEntries, canvasLayouts, templates
         |-- activityLog, settings


 Verification: How a new session determines progress

 A new Claude Code session can check which phase is complete by running these checks in order:

 # Phase 1: Does the project scaffold exist?
 test -f package.json && test -f src/app/layout.tsx && test -f src/lib/db/schema.ts

 # Phase 2: Do API routes exist and respond?
 test -f src/app/api/projects/route.ts && test -f src/stores/ui-store.ts

 # Phase 3: Does the custom server and WebSocket exist?
 test -f server/index.ts && test -f src/lib/ws/protocol.ts && test -f src/lib/claude/process-manager.ts

 # Phase 4: Do project management components exist?
 test -f src/components/projects/project-card.tsx && test -f src/components/projects/project-grid.tsx

 # Phase 5: Do canvas components exist?
 test -f src/components/canvas/team-canvas.tsx && test -f src/components/canvas/agent-node.tsx && test -f src/components/canvas/tunnel-edge.tsx

 # Phase 6: Do agent detail components exist?
 test -f src/components/agent-detail/agent-drawer.tsx && test -f src/components/agent-detail/agent-terminal.tsx

 # Phase 7: Do team control features work?
 test -f src/components/canvas/create-team-dialog.tsx && grep -q "spawnTeamLead" src/lib/claude/process-manager.ts

 # Phase 8: Do task board components exist?
 test -f src/components/tasks/task-board.tsx && test -f src/components/tasks/task-list.tsx && test -f src/components/tasks/task-inline.tsx

 # Phase 9: Do notification components exist?
 test -f src/components/notifications/activity-feed.tsx && test -f src/hooks/use-notification.ts

 # Phase 10: Do template components exist?
 test -f src/components/templates/template-gallery.tsx && test -f src/components/templates/template-editor.tsx

 # Phase 11: Do polish files exist?
 test -f CONTRIBUTING.md && test -f src/components/shared/error-boundary.tsx && test -f src/hooks/use-keyboard-shortcuts.ts


 Each phase builds on the previous. A new session should:
 1. Run the checks above to determine the last completed phase
 2. Read the plan to understand the next phase's tasks
 3. Start implementing the next incomplete phase