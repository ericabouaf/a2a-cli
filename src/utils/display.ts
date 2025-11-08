import {
  Message,
  Part,
  FilePart,
  DataPart,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
} from "@a2a-js/sdk";
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

export function printMessageContent(message: Message) {
  message.parts.forEach((part: Part, index: number) => {
    const partPrefix = colorize("gray", `  Part ${index + 1}/${message.parts.length}:`);
    if (part.kind === "text") {
      console.log(`${partPrefix} ${colorize("green", "📝 Text:")}`, part.text);
    } else if (part.kind === "file") {
      const filePart = part as FilePart;
      console.log(
        `${partPrefix} ${colorize("blue", "📄 File:")} Name: ${filePart.file.name || "N/A"
        }, Type: ${filePart.file.mimeType || "N/A"}, Source: ${("bytes" in filePart.file) ? "Inline (bytes)" : filePart.file.uri
        }`
      );
    } else if (part.kind === "data") {
      const dataPart = part as DataPart;
      console.log(
        `${partPrefix} ${colorize("yellow", "📊 Data:")}`,
        JSON.stringify(dataPart.data, null, 2)
      );
    } else {
      console.log(`${partPrefix} ${colorize("yellow", "Unsupported part kind:")}`, part);
    }
  });
}

export function printAgentEvent(
  event: TaskStatusUpdateEvent | TaskArtifactUpdateEvent,
  agentName: string = "Agent"
) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = colorize("magenta", `\n${agentName} [${timestamp}]:`);

  if (event.kind === "status-update") {
    const update = event as TaskStatusUpdateEvent;
    const state = update.status.state;
    let stateEmoji = "❓";
    let stateColor: keyof typeof colors = "yellow";

    switch (state) {
      case "working":
        stateEmoji = "⏳";
        stateColor = "blue";
        break;
      case "input-required":
        stateEmoji = "🤔";
        stateColor = "yellow";
        break;
      case "completed":
        stateEmoji = "✅";
        stateColor = "green";
        break;
      case "canceled":
        stateEmoji = "⏹️";
        stateColor = "gray";
        break;
      case "failed":
        stateEmoji = "❌";
        stateColor = "red";
        break;
      default:
        stateEmoji = "ℹ️";
        stateColor = "dim";
        break;
    }

    console.log(
      `${prefix} ${stateEmoji} Status: ${colorize(stateColor, state)} (Task: ${update.taskId}, Context: ${update.contextId}) ${update.final ? colorize("bright", "[FINAL]") : ""}`
    );

    if (update.status.message) {
      printMessageContent(update.status.message);
    }
  } else if (event.kind === "artifact-update") {
    const update = event as TaskArtifactUpdateEvent;
    console.log(
      `${prefix} 📄 Artifact Received: ${update.artifact.name || "(unnamed)"
      } (ID: ${update.artifact.artifactId}, Task: ${update.taskId}, Context: ${update.contextId})`
    );
    printMessageContent({
      messageId: generateId(),
      kind: "message",
      role: "agent",
      parts: update.artifact.parts,
      taskId: update.taskId,
      contextId: update.contextId,
    });
  } else {
    console.log(
      prefix,
      colorize("yellow", "Received unknown event type in printAgentEvent:"),
      event
    );
  }
}
