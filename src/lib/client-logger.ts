"use client";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: "color: #888",
  info: "color: #0ea5e9",
  warn: "color: #f59e0b",
  error: "color: #ef4444; font-weight: bold",
};

function log(level: LogLevel, component: string, message: string, data?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const style = LEVEL_STYLES[level];
  const prefix = `%c[${ts}] [${level.toUpperCase()}] [${component}]`;

  if (data) {
    console[level === "debug" ? "log" : level](prefix, style, message, data);
  } else {
    console[level === "debug" ? "log" : level](prefix, style, message);
  }
}

export function createClientLogger(component: string) {
  return {
    debug: (msg: string, data?: Record<string, unknown>) => log("debug", component, msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log("info", component, msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log("warn", component, msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log("error", component, msg, data),
  };
}
