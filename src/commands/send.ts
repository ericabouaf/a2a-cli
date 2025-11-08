import { A2AClient } from "@a2a-js/sdk/client";
import {
  MessageSendParams,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  Message,
  Task,
} from "@a2a-js/sdk";
import { colorize, printAgentEvent, printMessageContent, generateId } from "../utils/display.js";

export async function sendCommand(
  client: A2AClient,
  agentName: string,
  messageText: string,
  wait: boolean = false
) {
  const messageId = generateId();

  const messagePayload: Message = {
    messageId: messageId,
    kind: "message",
    role: "user",
    parts: [
      {
        kind: "text",
        text: messageText,
      },
    ],
  };

  const params: MessageSendParams = {
    message: messagePayload,
    configuration: {
      blocking: wait,
    },
  };

  try {
    console.log(colorize("dim", "Sending message..."));

    if (wait) {
      // Use streaming API and wait for completion
      const stream = client.sendMessageStream(params);

      for await (const event of stream) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = colorize("magenta", `\n${agentName} [${timestamp}]:`);

        if (event.kind === "status-update" || event.kind === "artifact-update") {
          const typedEvent = event as TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
          printAgentEvent(typedEvent, agentName);
        } else if (event.kind === "message") {
          const msg = event as Message;
          console.log(`${prefix} ${colorize("green", "✉️ Message:")}`);
          printMessageContent(msg);
        } else if (event.kind === "task") {
          const task = event as Task;
          console.log(`${prefix} ${colorize("blue", "ℹ️ Task:")} ID: ${task.id}, Context: ${task.contextId}, Status: ${task.status.state}`);
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
      console.log(colorize("green", `\n✓ Message sent and completed`));
    } else {
      // Fire and forget - just send the message
      const response = await client.sendMessage(params);

      if (client.isErrorResponse(response)) {
        throw new Error(`RPC Error: ${response.error.message} (code: ${response.error.code})`);
      }

      const result = response.result;
      console.log(colorize("green", `✓ Message sent successfully`));

      if (result.kind === "task") {
        const task = result as Task;
        console.log(colorize("dim", `   Task ID: ${task.id}`));
        console.log(colorize("dim", `   Context ID: ${task.contextId || "N/A"}`));
        console.log(colorize("dim", `   Status: ${task.status.state}`));

        if (task.status.message) {
          console.log(colorize("gray", "\n   Initial response:"));
          printMessageContent(task.status.message);
        }
      } else if (result.kind === "message") {
        const message = result as Message;
        console.log(colorize("dim", `   Message ID: ${message.messageId}`));
        if (message.taskId) {
          console.log(colorize("dim", `   Task ID: ${message.taskId}`));
        }
        if (message.contextId) {
          console.log(colorize("dim", `   Context ID: ${message.contextId}`));
        }
        console.log(colorize("gray", "\n   Response:"));
        printMessageContent(message);
      }
    }
  } catch (error: any) {
    console.error(
      colorize("red", `✗ Error sending message:`),
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
    process.exit(1);
  }
}
