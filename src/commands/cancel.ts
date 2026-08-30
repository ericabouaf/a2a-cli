import type { Client } from "@a2a-js/sdk/client";
import { colorize, printTaskDetails } from "../utils/display.js";

export async function cancelCommand(
  client: Client,
  _agentName: string,
  taskId: string
): Promise<number> {
  const task = await client.cancelTask({ tenant: "", id: taskId, metadata: undefined });

  console.log(colorize("green", "✓ Cancellation requested:"));
  printTaskDetails(task);
  return 0;
}
