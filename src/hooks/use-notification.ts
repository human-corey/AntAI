"use client";

import { toast } from "sonner";

type Severity = "info" | "success" | "warning" | "error";

export function useNotification() {
  const notify = (title: string, severity: Severity = "info") => {
    switch (severity) {
      case "success":
        toast.success(title);
        break;
      case "warning":
        toast.warning(title);
        break;
      case "error":
        toast.error(title);
        break;
      default:
        toast.info(title);
    }
  };

  return { notify };
}
