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

/**
 * Renders the `ask_user_question` / `permission_request` data part, if any.
 * `questionText` is the human-readable rendering the agent already sent: when
 * it spells out the options itself, we do not repeat them.
 */
function printPrompt(datas: any[], questionText: string) {
  for (const data of datas) {
    if (data?.kind === "ask_user_question") {
      for (const question of data.questions ?? []) {
        const options: any[] = question?.options ?? [];
        if (options.length === 0) continue;
        const labels = options.map((o) => o?.label ?? String(o));
        if (labels.every((label: string) => questionText.includes(label))) continue;
        for (const option of options) {
          const label = option?.label ?? String(option);
          const description = option?.description ? ` — ${option.description}` : "";
          console.log(colorize("gray", `     • ${label}${description}`));
        }
      }
    } else if (data?.kind === "permission_request") {
      console.log(colorize("gray", `     tool: ${data.toolName ?? "?"}`));
      console.log(colorize("gray", `     input: ${JSON.stringify(data.input ?? {})}`));
      console.log(colorize("gray", `     answer 'yes' to allow, anything else denies`));
    }
  }
}

/**
 * Drains a v1.0 stream and prints it. The stream ends on a terminal state and
 * on `input-required` alike.
 */
export async function renderStream(
  stream: AsyncGenerator<StreamResponse, void, undefined>,
  agentName: string
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
        console.log(
          colorize("gray", `  task ${task.id} · ${stateName(task.status?.state)}`)
        );
        break;
      }

      case "statusUpdate": {
        const update = payload.value;
        outcome.taskId = update.taskId || outcome.taskId;
        outcome.contextId = update.contextId || outcome.contextId;
        const state = update.status?.state;
        outcome.lastState = state;

        const texts = textParts(update.status?.message?.parts);
        const datas = dataParts(update.status?.message?.parts);

        if (state === TaskState.TASK_STATE_INPUT_REQUIRED) {
          const question = texts.join("\n").trim() || "The agent needs your input.";
          console.log(colorize("yellow", `❓ ${question}`));
          printPrompt(datas, question);
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
