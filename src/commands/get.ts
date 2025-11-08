import { A2AClient } from "@a2a-js/sdk/client";
import { colorize, printMessageContent } from "../utils/display.js";
import { Task, Artifact, Part } from "@a2a-js/sdk";

export async function getCommand(
  client: A2AClient,
  agentName: string,
  taskId: string
) {
  try {
    console.log(colorize("dim", `Fetching task ${taskId}...`));

    const response = await client.getTask({ id: taskId });

    if (client.isErrorResponse(response)) {
      throw new Error(`RPC Error: ${response.error.message} (code: ${response.error.code})`);
    }

    const task = response.result as Task;

    console.log(colorize("green", `\n✓ Task Details:`));
    console.log(`  Task ID:     ${colorize("bright", task.id || taskId)}`);
    console.log(`  Context ID:  ${task.contextId || "N/A"}`);
    console.log(`  Status:      ${colorize("bright", task.status.state)}`);

    if (task.status.message) {
      console.log(`\n  ${colorize("green", "Status Message:")}`);
      printMessageContent(task.status.message);
    }

    if (task.artifacts && task.artifacts.length > 0) {
      console.log(`\n  ${colorize("blue", `Artifacts (${task.artifacts.length}):`)}`)
      task.artifacts.forEach((artifact: Artifact, idx: number) => {
        console.log(`    ${idx + 1}. ${artifact.name || "(unnamed)"} (ID: ${artifact.artifactId})`);
        if (artifact.parts && artifact.parts.length > 0) {
          artifact.parts.forEach((part: Part, partIdx: number) => {
            if (part.kind === "text") {
              console.log(colorize("gray", `       Part ${partIdx + 1}: Text - ${part.text.substring(0, 60)}${part.text.length > 60 ? "..." : ""}`));
            } else if (part.kind === "file") {
              console.log(colorize("gray", `       Part ${partIdx + 1}: File - ${part.file.name || "N/A"}`));
            } else if (part.kind === "data") {
              console.log(colorize("gray", `       Part ${partIdx + 1}: Data`));
            }
          });
        }
      });
    }

  } catch (error: any) {
    console.error(
      colorize("red", `✗ Error fetching task:`),
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
