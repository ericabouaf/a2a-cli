import { A2AClient } from "@a2a-js/sdk/client";
import { colorize } from "../utils/display.js";

export async function cancelCommand(
  client: A2AClient,
  agentName: string,
  taskId: string
) {
  try {
    console.log(colorize("dim", `Canceling task ${taskId}...`));

    const response = await client.cancelTask({ id: taskId });

    if (client.isErrorResponse(response)) {
      throw new Error(`RPC Error: ${response.error.message} (code: ${response.error.code})`);
    }

    console.log(colorize("green", `✓ Task ${taskId} has been canceled`));

  } catch (error: any) {
    console.error(
      colorize("red", `✗ Error canceling task:`),
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
