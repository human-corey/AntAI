import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  workingDir: text("working_dir").notNull(),
  status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  status: text("status", { enum: ["idle", "starting", "running", "stopping", "stopped", "error"] }).notNull().default("idle"),
  config: text("config", { mode: "json" }).notNull().$type<{
    leadModel?: string;
    leadSystemPrompt?: string;
    members: { name: string; role: string; model?: string; systemPrompt?: string }[];
    initialTasks?: string[];
  }>(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull().default("teammate"),
  model: text("model").notNull().default("claude-sonnet-4-6"),
  status: text("status", { enum: ["idle", "running", "thinking", "tool_use", "error", "stopped", "crashed"] }).notNull().default("idle"),
  isLead: integer("is_lead", { mode: "boolean" }).notNull().default(false),
  pid: integer("pid"),
  sessionId: text("session_id"),
  currentTask: text("current_task"),
  lastOutput: text("last_output"),
  startedAt: text("started_at"),
  stoppedAt: text("stopped_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
  agentId: text("agent_id").references(() => agents.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  description: text("description").notNull().default(""),
  status: text("status", { enum: ["pending", "in_progress", "completed", "blocked", "failed"] }).notNull().default("pending"),
  blockedBy: text("blocked_by", { mode: "json" }).notNull().default([]).$type<string[]>(),
  blocks: text("blocks", { mode: "json" }).notNull().default([]).$type<string[]>(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  fromAgentId: text("from_agent_id"),
  toAgentId: text("to_agent_id"),
  content: text("content").notNull(),
  type: text("type", { enum: ["user", "agent", "system", "tool_use", "tool_result"] }).notNull().default("agent"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const logEntries = sqliteTable("log_entries", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  teamId: text("team_id"),
  agentId: text("agent_id"),
  level: text("level", { enum: ["info", "warn", "error", "debug", "tool_use", "tool_result"] }).notNull().default("info"),
  message: text("message").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const canvasLayouts = sqliteTable("canvas_layouts", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  nodeId: text("node_id").notNull(),
  x: integer("x").notNull().default(0),
  y: integer("y").notNull().default(0),
  collapsed: integer("collapsed", { mode: "boolean" }).notNull().default(false),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  config: text("config", { mode: "json" }).notNull().$type<{
    leadModel?: string;
    leadSystemPrompt?: string;
    members: { name: string; role: string; model?: string; systemPrompt?: string }[];
    initialTasks?: string[];
  }>(),
  tags: text("tags", { mode: "json" }).notNull().default([]).$type<string[]>(),
  isBuiltIn: integer("is_built_in", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey(),
  projectId: text("project_id"),
  teamId: text("team_id"),
  agentId: text("agent_id"),
  type: text("type", { enum: ["team_started", "team_stopped", "agent_spawned", "agent_stopped", "agent_error", "task_created", "task_completed", "task_failed", "message_sent", "system"] }).notNull(),
  title: text("title").notNull(),
  detail: text("detail"),
  severity: text("severity", { enum: ["info", "success", "warning", "error"] }).notNull().default("info"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull().$type<unknown>(),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});
