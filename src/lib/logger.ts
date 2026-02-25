import fs from "fs";
import path from "path";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",  // gray
  info: "\x1b[36m",   // cyan
  warn: "\x1b[33m",   // yellow
  error: "\x1b[31m",  // red
};

const RESET = "\x1b[0m";

const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "debug";

// Log file path
const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "antai.log");

// Ensure log directory exists
try {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
} catch { /* ignore */ }

function formatTimestamp(): string {
  return new Date().toISOString();
}

function writeToFile(line: string) {
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch { /* ignore file write errors */ }
}

function log(level: LogLevel, component: string, message: string, data?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;

  const ts = formatTimestamp();
  const color = LEVEL_COLORS[level];
  const lvl = level.toUpperCase().padEnd(5);
  const comp = component.padEnd(16);
  const dataStr = data ? " " + JSON.stringify(data) : "";

  // Console output (colored)
  console.log(`${color}[${ts}] [${lvl}] [${comp}]${RESET} ${message}${dataStr}`);

  // File output (plain)
  writeToFile(`[${ts}] [${lvl}] [${comp}] ${message}${dataStr}`);
}

export function createLogger(component: string) {
  return {
    debug: (msg: string, data?: Record<string, unknown>) => log("debug", component, msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log("info", component, msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log("warn", component, msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log("error", component, msg, data),
  };
}

// Pre-built loggers for common components
export const serverLog = createLogger("Server");
export const wsLog = createLogger("WebSocket");
export const processLog = createLogger("ProcessMgr");
export const parserLog = createLogger("OutputParser");
export const apiLog = createLogger("API");
export const fileWatchLog = createLogger("FileWatcher");
