import type { Client } from "@a2a-js/sdk/client";
import { Task, TaskState } from "@a2a-js/sdk";
import {
  buildUserMessage,
  colorize,
  formatState,
  printParts,
} from "../utils/display.js";
import { renderStream } from "../utils/stream.js";

export interface SendOptions {
  wait?: boolean;
  /** Continue an existing conversation. */
  context?: string;
  /** Answer a task parked in `input-required`. */
  task?: string;
}

/** `sendMessage` returns `Message | Task`; v1.0 dropped the `kind` tag. */
function isTask(result: unknown): result is Task {
  return typeof result === "object" && result !== null && "id" in result && "status" in result;
}

/** Returns the process exit code. */
export async function sendCommand(
  client: Client,
  agentName: string,
  messageText: string,
  options: SendOptions = {}
): Promise<number> {
  const message = buildUserMessage(messageText, {
    taskId: options.task,
    contextId: options.context,
  });

  if (options.wait) {
    const outcome = await renderStream(
      client.sendMessageStream({
        tenant: "",
        message,
        configuration: undefined,
        metadata: undefined,
      }),
      agentName
    );

    if (outcome.taskId) console.log(colorize("gray", `  task ${outcome.taskId}`));
    if (outcome.contextId) console.log(colorize("gray", `  context ${outcome.contextId}`));
    if (outcome.inputRequired) {
      console.log(
        colorize(
          "gray",
          `  answer with: a2a-cli send "<answer>" --task ${outcome.taskId} --context ${outcome.contextId}`
        )
      );
    }
    return outcome.lastState === TaskState.TASK_STATE_FAILED ? 1 : 0;
  }

  // Fire and forget: ask the server to return as soon as the task exists.
  const result = await client.sendMessage({
    tenant: "",
    message,
    configuration: {
      acceptedOutputModes: [],
      taskPushNotificationConfig: undefined,
      returnImmediately: true,
    },
    metadata: undefined,
  });

  if (isTask(result)) {
    console.log(colorize("green", "✓ Message sent"));
    console.log(`  Task ID:    ${colorize("bright", result.id)}`);
    console.log(`  Context ID: ${result.contextId || "(none)"}`);
    console.log(`  State:      ${formatState(result.status?.state)}`);
    if (result.status?.message?.parts?.length) {
      console.log(colorize("gray", "  Status message:"));
      printParts(result.status.message.parts, "    ");
    }
    return 0;
  }

  console.log(colorize("green", "✓ Message sent"));
  console.log(`  Message ID: ${colorize("bright", result.messageId)}`);
  if (result.taskId) console.log(`  Task ID:    ${result.taskId}`);
  if (result.contextId) console.log(`  Context ID: ${result.contextId}`);
  printParts(result.parts, "  ");
  return 0;
}
