import { A2AClient } from "@a2a-js/sdk/client";
import { AgentCard } from "@a2a-js/sdk";
import { colorize } from "./display.js";

export async function initializeClient(serverUrl: string): Promise<{ client: A2AClient, agentName: string }> {
  console.log(
    colorize("dim", `Attempting to connect to agent at: ${serverUrl}`)
  );
  try {
    const client = await A2AClient.fromCardUrl(serverUrl);
    const card: AgentCard = await client.getAgentCard();
    const agentName = card.name || "Agent";
    console.log(colorize("green", `✓ Agent Card Found:`));
    console.log(`  Name:        ${colorize("bright", agentName)}`);
    if (card.description) {
      console.log(`  Description: ${card.description}`);
    }
    console.log(`  Version:     ${card.version || "N/A"}`);
    if (card.capabilities?.streaming) {
      console.log(`  Streaming:   ${colorize("green", "Supported")}`);
    } else {
      console.log(`  Streaming:   ${colorize("yellow", "Not Supported (or not specified)")}`);
    }
    return { client, agentName };
  } catch (error: any) {
    console.log(
      colorize("yellow", `⚠️ Error connecting to agent or fetching card`)
    );
    throw error;
  }
}
