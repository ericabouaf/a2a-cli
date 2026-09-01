import { Artifact, Message, Part, Role, Task, TaskState } from "@a2a-js/sdk";
import crypto from "node:crypto";

export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

export function colorize(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * A2A v1.0 states are a numeric enum on the wire. Never show the number:
 * `3` -> `COMPLETED`.
 */
export function stateName(state: TaskState | undefined): string {
  if (state === undefined) return "UNKNOWN";
  const raw = TaskState[state];
  return typeof raw === "string" ? raw.replace(/^TASK_STATE_/, "") : `UNKNOWN(${state})`;
}

const STATE_ICONS: Partial<Record<TaskState, string>> = {
  [TaskState.TASK_STATE_SUBMITTED]: "📥",
  [TaskState.TASK_STATE_WORKING]: "⏳",
  [TaskState.TASK_STATE_COMPLETED]: "✅",
  [TaskState.TASK_STATE_FAILED]: "❌",
  [TaskState.TASK_STATE_CANCELED]: "⏹️",
  [TaskState.TASK_STATE_INPUT_REQUIRED]: "❓",
  [TaskState.TASK_STATE_REJECTED]: "🚫",
  [TaskState.TASK_STATE_AUTH_REQUIRED]: "🔒",
};

const STATE_COLORS: Partial<Record<TaskState, keyof typeof colors>> = {
  [TaskState.TASK_STATE_SUBMITTED]: "gray",
  [TaskState.TASK_STATE_WORKING]: "blue",
  [TaskState.TASK_STATE_COMPLETED]: "green",
  [TaskState.TASK_STATE_FAILED]: "red",
  [TaskState.TASK_STATE_CANCELED]: "gray",
  [TaskState.TASK_STATE_INPUT_REQUIRED]: "yellow",
  [TaskState.TASK_STATE_REJECTED]: "red",
  [TaskState.TASK_STATE_AUTH_REQUIRED]: "yellow",
};

export function stateIcon(state: TaskState | undefined): string {
  return (state !== undefined && STATE_ICONS[state]) || "ℹ️";
}

export function stateColor(state: TaskState | undefined): keyof typeof colors {
  return (state !== undefined && STATE_COLORS[state]) || "dim";
}

/** States after which the agent will not send anything else for this task. */
const TERMINAL_STATES: ReadonlySet<TaskState> = new Set([
  TaskState.TASK_STATE_COMPLETED,
  TaskState.TASK_STATE_FAILED,
  TaskState.TASK_STATE_CANCELED,
  TaskState.TASK_STATE_REJECTED,
]);

export function isTerminal(state: TaskState | undefined): boolean {
  return state !== undefined && TERMINAL_STATES.has(state);
}

export function formatState(state: TaskState | undefined): string {
  return `${stateIcon(state)} ${colorize(stateColor(state), stateName(state))}`;
}

/** The `text` values carried by a v1.0 part list. */
export function textParts(parts: Part[] | undefined): string[] {
  return (parts ?? [])
    .filter((p) => p.content?.$case === "text")
    .map((p) => (p.content as { $case: "text"; value: string }).value);
}

/** The `data` values carried by a v1.0 part list. */
export function dataParts(parts: Part[] | undefined): any[] {
  return (parts ?? [])
    .filter((p) => p.content?.$case === "data")
    .map((p) => (p.content as { $case: "data"; value: any }).value);
}

/** Builds a v1.0 user message. Empty string means "unset" for the id fields. */
export function buildUserMessage(
  text: string,
  ids: { taskId?: string; contextId?: string } = {}
): Message {
  return {
    messageId: generateId(),
    contextId: ids.contextId ?? "",
    taskId: ids.taskId ?? "",
    role: Role.ROLE_USER,
    parts: [
      {
        content: { $case: "text", value: text },
        metadata: undefined,
        filename: "",
        mediaType: "text/plain",
      },
    ],
    metadata: undefined,
    extensions: [],
    referenceTaskIds: [],
  };
}

export function preview(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

export function printParts(parts: Part[] | undefined, indent = "  ") {
  for (const part of parts ?? []) {
    switch (part.content?.$case) {
      case "text":
        console.log(`${indent}${part.content.value}`);
        break;
      case "data":
        console.log(
          `${indent}${colorize("yellow", "📊 data:")} ${JSON.stringify(part.content.value)}`
        );
        break;
      case "url":
        console.log(
          `${indent}${colorize("blue", "🔗 file:")} ${part.filename || "(unnamed)"} ${part.content.value}`
        );
        break;
      case "raw":
        console.log(
          `${indent}${colorize("blue", "📄 file:")} ${part.filename || "(unnamed)"} (${part.mediaType || "?"}, inline bytes)`
        );
        break;
      default:
        console.log(`${indent}${colorize("gray", "(empty part)")}`);
    }
  }
}

export function printArtifact(artifact: Artifact | undefined, indent = "  ") {
  if (!artifact) return;
  const name = artifact.name || "(unnamed)";
  console.log(`${indent}${colorize("blue", "📄 artifact:")} ${name} ${colorize("gray", `(${artifact.artifactId})`)}`);
  const texts = textParts(artifact.parts);
  if (texts.length > 0) {
    console.log(`${indent}  ${colorize("gray", preview(texts.join(" ")))}`);
  }
}

export function printTaskDetails(task: Task) {
  console.log(`  Task ID:    ${colorize("bright", task.id)}`);
  console.log(`  Context ID: ${task.contextId || "(none)"}`);
  console.log(`  State:      ${formatState(task.status?.state)}`);

  const texts = textParts(task.status?.message?.parts);
  const datas = dataParts(task.status?.message?.parts);
  if (texts.length > 0 || datas.length > 0) {
    console.log(`\n  ${colorize("green", "Status message:")}`);
    printParts(task.status?.message?.parts, "    ");
  }

  if (task.artifacts?.length) {
    console.log(`\n  ${colorize("blue", `Artifacts (${task.artifacts.length}):`)}`);
    for (const artifact of task.artifacts) printArtifact(artifact, "    ");
  }
}

/**
 * Exits once stdout has drained. The SDK's keep-alive HTTP sockets can hold
 * the event loop open long after the last response, so we cannot just return.
 */
export function finish(code = 0): void {
  process.exitCode = code;
  process.stdout.write("", () => process.exit(code));
}
