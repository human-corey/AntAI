"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme as "light" | "dark" | "system"}
      position="bottom-right"
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        className: "!bg-[var(--card)] !border-[var(--border)] !text-[var(--foreground)]",
      }}
    />
  );
}
