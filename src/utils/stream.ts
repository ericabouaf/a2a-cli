import { StreamResponse, TaskState } from "@a2a-js/sdk";
import {
  colorize,
  dataParts,
  formatState,
  isTerminal,
  printArtifact,
  stateName,
  textParts,
} from "./display.js";

export interface StreamOutcome {
  taskId?: string;
  contextId?: string;
  /** State of the last status update seen on the stream. */
  lastState?: TaskState;
  /** True when the agent parked on a question and is waiting for an answer. */
  inputRequired: boolean;
}

export interface RenderOptions {
  /**
   * The task this turn is answering, when the client is replying to a task
   * parked in `input-required`. A `task` event carrying this id is the agent's
   * resume snapshot, not a new task.
   */
  answeringTaskId?: string;
}

/**
 * Renders the `ask_user_question` / `permission_request` data part.
 *
 * The agent's text part is the bare prompt: options, tool input and the rest
 * live in the data part alone, so everything below is printed unconditionally
 * — nothing can be a duplicate of the question text.
 */
function printPrompt(datas: any[]) {
  for (const data of datas) {
    if (data?.kind === "ask_user_question") {
      for (const question of data.questions ?? []) {
        for (const option of question?.options ?? []) {
          const label = option?.label ?? String(option);
          const description = option?.description ? ` — ${option.description}` : "";
          console.log(colorize("gray", `   - ${label}${description}`));
        }
        if (question?.multiSelect) {
          console.log(colorize("gray", `   (several answers allowed)`));
        }
      }
      console.log(colorize("gray", `   reply with your answer (free text works)`));
    } else if (data?.kind === "permission_request") {
      console.log(colorize("gray", `   tool: ${data.toolName ?? "?"}`));
      console.log(colorize("gray", `   input: ${JSON.stringify(data.input ?? {})}`));
      if (data.decisionReason) {
        console.log(colorize("gray", `   why: ${data.decisionReason}`));
      }
      console.log(colorize("gray", `   reply 'yes' to allow, anything else denies`));
    }
  }
}

/**
 * Drains a v1.0 stream and prints it. The stream ends on a terminal state and
 * on `input-required` alike.
 *
 * Status messages are dispatched on their `metadata.kind` (the server's event
 * stream contract): `tool_use` is progress noise, `result` is the agent's
 * answer, `resumed` says a parked task is running again. An unmarked message
 * is printed as the agent's line, as before.
 */
export async function renderStream(
  stream: AsyncGenerator<StreamResponse, void, undefined>,
  agentName: string,
  options: RenderOptions = {}
): Promise<StreamOutcome> {
  const outcome: StreamOutcome = { inputRequired: false };
  const agentPrefix = colorize("magenta", `${agentName}:`);

  for await (const event of stream) {
    const payload = event.payload;
    if (!payload) continue;

    switch (payload.$case) {
      case "task": {
        const task = payload.value;
        outcome.taskId = task.id || outcome.taskId;
        outcome.contextId = task.contextId || outcome.contextId;
        if (options.answeringTaskId && task.id === options.answeringTaskId) {
          // The agent republished the task we are answering: a resume, not a
          // new task. Its state is the parked one (INPUT_REQUIRED), which
          // would read as a stale question if printed as a state line.
          console.log(colorize("gray", `  ↩ resuming task ${task.id}`));
        } else {
          console.log(
            colorize("gray", `  task ${task.id} · ${stateName(task.status?.state)}`)
          );
        }
        break;
      }

      case "statusUpdate": {
        const update = payload.value;
        outcome.taskId = update.taskId || outcome.taskId;
        outcome.contextId = update.contextId || outcome.contextId;
        const state = update.status?.state;
        outcome.lastState = state;

        const message = update.status?.message;
        const kind = (message?.metadata as { kind?: string } | undefined)?.kind;
        const texts = textParts(message?.parts);
        const datas = dataParts(message?.parts);

        if (state === TaskState.TASK_STATE_INPUT_REQUIRED) {
          const question = texts.join("\n").trim() || "The agent needs your input.";
          console.log(colorize("yellow", `❓ ${question}`));
          printPrompt(datas);
        } else if (kind === "tool_use") {
          const toolName = (message?.metadata as { toolName?: string } | undefined)?.toolName;
          const label = toolName || texts.join(" ").trim() || "tool";
          console.log(colorize("dim", `⚙ ${label}`));
        } else if (kind === "resumed") {
          // Already announced by the `↩ resuming task` line above.
        } else {
          for (const text of texts) console.log(`${agentPrefix} ${text}`);
          if (isTerminal(state)) console.log(formatState(state));
        }
        break;
      }

      case "artifactUpdate": {
        const update = payload.value;
        outcome.taskId = update.taskId || outcome.taskId;
        outcome.contextId = update.contextId || outcome.contextId;
        printArtifact(update.artifact);
        break;
      }

      case "message": {
        const message = payload.value;
        outcome.taskId = message.taskId || outcome.taskId;
        outcome.contextId = message.contextId || outcome.contextId;
        for (const text of textParts(message.parts)) console.log(`${agentPrefix} ${text}`);
        break;
      }

      default:
        console.log(colorize("gray", `  (unhandled stream payload)`));
    }
  }

  outcome.inputRequired = outcome.lastState === TaskState.TASK_STATE_INPUT_REQUIRED;
  return outcome;
}
