#!/usr/bin/env node

import { Command } from "commander";
import { extractErrorMessage } from "@a2a-js/sdk/errors";
import * as fs from "node:fs";
import { initializeClient } from "./utils/client.js";
import { colorize, finish } from "./utils/display.js";
import { chatCommand } from "./commands/chat.js";
import { sendCommand } from "./commands/send.js";
import { getCommand } from "./commands/get.js";
import { cancelCommand } from "./commands/cancel.js";

const DEFAULT_SERVER = "http://localhost:3008";

const program = new Command();

program
  .name("a2a-cli")
  .description("A CLI client for A2A (protocol v1.0) agents")
  .version("2.0.0")
  .option(
    "-s, --server <url>",
    "Agent base URL (the agent card is fetched at <url>/.well-known/agent-card.json)",
    DEFAULT_SERVER
  );

/** Runs a command, turning any A2A/transport error into a clean exit 1. */
async function run(
  fn: (client: Awaited<ReturnType<typeof initializeClient>>) => Promise<number>,
  options: { banner?: boolean } = {}
): Promise<void> {
  const serverUrl: string = program.opts().server;
  try {
    const connection = await initializeClient(serverUrl, options);
    finish(await fn(connection));
  } catch (error) {
    console.error(colorize("red", `✗ ${extractErrorMessage(error)}`));
    finish(1);
  }
}

program
  .command("send")
  .description("Send a message to the agent")
  .argument("[message]", "Message to send (read from stdin if omitted)")
  .option("-w, --wait", "Stream the task until it finishes or asks a question", false)
  .option("-c, --context <id>", "Continue an existing conversation (contextId)")
  .option("-t, --task <id>", "Answer a task waiting in input-required (taskId)")
  .action(async (message, options) => {
    const messageText = (message ?? fs.readFileSync(0, "utf-8")).trim();
    if (!messageText) {
      console.error(colorize("red", "✗ No message provided"));
      finish(1);
      return;
    }
    await run(({ client, agentName }) =>
      sendCommand(client, agentName, messageText, options)
    );
  });

program
  .command("chat")
  .description("Start an interactive chat session with the agent")
  .action(async () => {
    console.log(colorize("bright", "A2A Terminal Client"));
    console.log(colorize("dim", `Agent base URL: ${program.opts().server}`));
    await run(async ({ client, agentName }) => {
      await chatCommand(client, agentName);
      return 0;
    }, { banner: true });
  });

program
  .command("get")
  .description("Get details about a specific task")
  .argument("<task-id>", "Task ID to retrieve")
  .option("-n, --history <count>", "Number of history messages to include", (v) => Number(v))
  .action(async (taskId, options) => {
    await run(({ client, agentName }) =>
      getCommand(client, agentName, taskId, { historyLength: options.history })
    );
  });

program
  .command("cancel")
  .description("Cancel a running task")
  .argument("<task-id>", "Task ID to cancel")
  .action(async (taskId) => {
    await run(({ client, agentName }) => cancelCommand(client, agentName, taskId));
  });

program.parse();
