import readline from "node:readline";
import { A2AClient } from "@a2a-js/sdk/client";
import {
  MessageSendParams,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  Message,
  Task,
} from "@a2a-js/sdk";
import { colorize, printAgentEvent, printMessageContent, generateId } from "../utils/display.js";

export async function chatCommand(client: A2AClient, agentName: string) {
  let currentTaskId: string | undefined = undefined;
  let currentContextId: string | undefined = undefined;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: colorize("cyan", "You: "),
  });

  console.log(colorize("dim", `No active task or context initially. Use '/new' to start a fresh session or send a message.`));
  console.log(
    colorize("green", `Enter messages, or use '/new' to start a new session. '/exit' to quit.`)
  );

  rl.setPrompt(colorize("cyan", `${agentName} > You: `));
  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    rl.setPrompt(colorize("cyan", `${agentName} > You: `));

    if (!input) {
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === "/new") {
      currentTaskId = undefined;
      currentContextId = undefined;
      console.log(
        colorize("bright", `✨ Starting new session. Task and Context IDs are cleared.`)
      );
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === "/exit") {
      rl.close();
      return;
    }

    const messageId = generateId();

    const messagePayload: Message = {
      messageId: messageId,
      kind: "message",
      role: "user",
      parts: [
        {
          kind: "text",
          text: input,
        },
      ],
    };

    if (currentTaskId) {
      messagePayload.taskId = currentTaskId;
    }
    if (currentContextId) {
      messagePayload.contextId = currentContextId;
    }

    const params: MessageSendParams = {
      message: messagePayload,
    };

    try {
      console.log(colorize("dim", "Sending message..."));
      const stream = client.sendMessageStream(params);

      for await (const event of stream) {

        //console.log("DEBUG event", event);

        const timestamp = new Date().toLocaleTimeString();
        const prefix = colorize("magenta", `\n${agentName} [${timestamp}]:`);

        if (event.kind === "status-update" || event.kind === "artifact-update") {
          const typedEvent = event as TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
          printAgentEvent(typedEvent, agentName);

          if (typedEvent.kind === "status-update" && (typedEvent as TaskStatusUpdateEvent).final && (typedEvent as TaskStatusUpdateEvent).status.state !== "input-required") {
            console.log(colorize("yellow", `   Task ${typedEvent.taskId} is final. Clearing current task ID.`));
            currentTaskId = undefined;
          }

        } else if (event.kind === "message") {
          const msg = event as Message;
          console.log(`${prefix} ${colorize("green", "✉️ Message Stream Event:")}`);
          printMessageContent(msg);
          if (msg.taskId && msg.taskId !== currentTaskId) {
            console.log(colorize("dim", `   Task ID context updated to ${msg.taskId} based on message event.`));
            currentTaskId = msg.taskId;
          }
          if (msg.contextId && msg.contextId !== currentContextId) {
            console.log(colorize("dim", `   Context ID updated to ${msg.contextId} based on message event.`));
            currentContextId = msg.contextId;
          }
        } else if (event.kind === "task") {
          const task = event as Task;
          console.log(`${prefix} ${colorize("blue", "ℹ️ Task Stream Event:")} ID: ${task.id}, Context: ${task.contextId}, Status: ${task.status.state}`);
          if (task.id !== currentTaskId) {
            console.log(colorize("dim", `   Task ID updated from ${currentTaskId || 'N/A'} to ${task.id}`));
            currentTaskId = task.id;
          }
          if (task.contextId && task.contextId !== currentContextId) {
            console.log(colorize("dim", `   Context ID updated from ${currentContextId || 'N/A'} to ${task.contextId}`));
            currentContextId = task.contextId;
          }
          if (task.status.message) {
            console.log(colorize("gray", "   Task includes message:"));
            printMessageContent(task.status.message);
          }
          if (task.artifacts && task.artifacts.length > 0) {
            console.log(colorize("gray", `   Task includes ${task.artifacts.length} artifact(s).`));
          }
        } else {
          console.log(prefix, colorize("yellow", "Received unknown event structure from stream:"), event);
        }
      }
      console.log(colorize("dim", `--- End of response stream for this input ---`));
    } catch (error: any) {
      const timestamp = new Date().toLocaleTimeString();
      const prefix = colorize("red", `\n${agentName} [${timestamp}] ERROR:`);
      console.error(
        prefix,
        `Error communicating with agent:`,
        error.message || error
      );
      if (error.code) {
        console.error(colorize("gray", `   Code: ${error.code}`));
      }
      if (error.data) {
        console.error(
          colorize("gray", `   Data: ${JSON.stringify(error.data)}`)
        );
      }
      if (!(error.code || error.data) && error.stack) {
        console.error(colorize("gray", error.stack.split('\n').slice(1, 3).join('\n')));
      }
    } finally {
      rl.prompt();
    }
  }).on("close", () => {
    console.log(colorize("yellow", "\nExiting A2A Terminal Client. Goodbye!"));
    process.exit(0);
  });
}
