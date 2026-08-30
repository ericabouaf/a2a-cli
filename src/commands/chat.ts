import readline from "node:readline";
import type { Client } from "@a2a-js/sdk/client";
import { extractErrorMessage } from "@a2a-js/sdk/errors";
import { buildUserMessage, colorize } from "../utils/display.js";
import { renderStream } from "../utils/stream.js";

/**
 * Interactive session.
 *
 * - `contextId` is kept for the whole conversation (that is what makes the
 *   agent remember previous turns).
 * - `taskId` is kept **only** while the current task sits in `input-required`,
 *   so that the next line answers the pending question instead of starting a
 *   new task.
 */
export async function chatCommand(client: Client, agentName: string) {
  let taskId = "";
  let contextId = "";

  const interactive = Boolean(process.stdin.isTTY);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: interactive,
  });
  const prompt = colorize("cyan", `${agentName} > You: `);

  console.log(
    colorize("green", "Type a message. '/new' starts a fresh session, '/exit' quits.")
  );
  if (interactive) process.stdout.write(prompt);

  // The async iterator applies backpressure, so a piped stdin is processed one
  // line at a time instead of firing every line at once.
  for await (const line of rl) {
    const input = line.trim();

    if (!input) {
      if (interactive) process.stdout.write(prompt);
      continue;
    }

    if (input.toLowerCase() === "/exit") break;

    if (input.toLowerCase() === "/new") {
      taskId = "";
      contextId = "";
      console.log(colorize("bright", "✨ New session: task and context ids cleared."));
      if (interactive) process.stdout.write(prompt);
      continue;
    }

    // Echo the input when stdin is piped, so the transcript stays readable.
    if (!interactive) console.log(colorize("cyan", `You: ${input}`));

    try {
      const outcome = await renderStream(
        client.sendMessageStream({
          tenant: "",
          message: buildUserMessage(input, { taskId, contextId }),
          configuration: undefined,
          metadata: undefined,
        }),
        agentName,
        // Non-empty only while answering a parked task: lets the renderer show
        // the agent's task snapshot as a resume instead of a new task.
        { answeringTaskId: taskId || undefined }
      );

      contextId = outcome.contextId ?? contextId;
      taskId = outcome.inputRequired && outcome.taskId ? outcome.taskId : "";
    } catch (error) {
      console.error(colorize("red", `✗ ${extractErrorMessage(error)}`));
    }

    if (interactive) process.stdout.write(prompt);
  }

  rl.close();
  console.log(colorize("yellow", "Bye."));
}
