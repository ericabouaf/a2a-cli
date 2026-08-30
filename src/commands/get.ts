import type { Client } from "@a2a-js/sdk/client";
import { colorize, printTaskDetails } from "../utils/display.js";

export async function getCommand(
  client: Client,
  _agentName: string,
  taskId: string,
  options: { historyLength?: number } = {}
): Promise<number> {
  const task = await client.getTask({
    tenant: "",
    id: taskId,
    historyLength: options.historyLength,
  });

  console.log(colorize("green", "✓ Task details:"));
  printTaskDetails(task);
  return 0;
}
