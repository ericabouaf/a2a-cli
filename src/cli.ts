#!/usr/bin/env node

import { Command } from "commander";
import { initializeClient } from "./utils/client.js";
import { colorize } from "./utils/display.js";
import { chatCommand } from "./commands/chat.js";
import { sendCommand } from "./commands/send.js";
import { getCommand } from "./commands/get.js";
import { cancelCommand } from "./commands/cancel.js";
import * as fs from "node:fs";

const program = new Command();

program
  .name("a2a-cli")
  .description("A CLI client for A2A agents")
  .version("1.0.0")
  .option("-s, --server <url>", "Agent server URL", "http://localhost:41241");

// Send command
program
  .command("send")
  .description("Send a message to the agent")
  .argument("[message]", "Message to send (or read from stdin if not provided)")
  .option("-w, --wait", "Wait for task completion (streaming mode)", false)
  .action(async (message, options) => {
    const serverUrl = program.opts().server;

    let messageText: string;

    if (message) {
      messageText = message;
    } else {
      // Read from stdin
      const stdin = fs.readFileSync(0, "utf-8");
      messageText = stdin.trim();
      if (!messageText) {
        console.error(colorize("red", "✗ No message provided"));
        process.exit(1);
      }
    }

    try {
      const { client, agentName } = await initializeClient(serverUrl);
      await sendCommand(client, agentName, messageText, options.wait);
    } catch (error: any) {
      console.error(colorize("red", `✗ Failed to initialize client: ${error.message}`));
      process.exit(1);
    }
  });

// Chat command
program
  .command("chat")
  .description("Start an interactive chat session with the agent")
  .action(async () => {
    const serverUrl = program.opts().server;

    console.log(colorize("bright", `A2A Terminal Client`));
    console.log(colorize("dim", `Agent Base URL: ${serverUrl}`));

    try {
      const { client, agentName } = await initializeClient(serverUrl);
      await chatCommand(client, agentName);
    } catch (error: any) {
      console.error(colorize("red", `✗ Failed to initialize client: ${error.message}`));
      process.exit(1);
    }
  });

// Get command
program
  .command("get")
  .description("Get details about a specific task")
  .argument("<task-id>", "Task ID to retrieve")
  .action(async (taskId) => {
    const serverUrl = program.opts().server;

    try {
      const { client, agentName } = await initializeClient(serverUrl);
      await getCommand(client, agentName, taskId);
    } catch (error: any) {
      console.error(colorize("red", `✗ Failed to initialize client: ${error.message}`));
      process.exit(1);
    }
  });

// Cancel command
program
  .command("cancel")
  .description("Cancel a running task")
  .argument("<task-id>", "Task ID to cancel")
  .action(async (taskId) => {
    const serverUrl = program.opts().server;

    try {
      const { client, agentName } = await initializeClient(serverUrl);
      await cancelCommand(client, agentName, taskId);
    } catch (error: any) {
      console.error(colorize("red", `✗ Failed to initialize client: ${error.message}`));
      process.exit(1);
    }
  });

// Default to chat if no command specified (for backward compatibility)
if (process.argv.length === 2 || (process.argv.length === 4 && process.argv[2] === '--server')) {
  process.argv.push('chat');
}

program.parse();
