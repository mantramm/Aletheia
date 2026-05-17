import type { AletheiaState } from "./types";

let log: AletheiaState["syncLog"] = [];

export function pushLog(
  text: string,
  status: "pending" | "done" | "failed"
): void {
  log.push({
    id: crypto.randomUUID(),
    text,
    timestamp: new Date().toISOString(),
    status,
  });
}

export function getLog(): AletheiaState["syncLog"] {
  return [...log];
}

export function clearLog(): void {
  log = [];
}
