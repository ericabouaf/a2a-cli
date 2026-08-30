import { Client, ClientFactory } from "@a2a-js/sdk/client";
import { AgentCard } from "@a2a-js/sdk";
import { colorize } from "./display.js";

/**
 * A2A v1.0 clients are built from the agent's **base URL**: the SDK fetches
 * `/.well-known/agent-card.json` under it and picks a transport. Users coming
 * from v0.3 (where the CLI wanted the card URL) get their input fixed up here.
 */
export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  const stripped = trimmed.replace(/\/\.well-known\/agent-card(\.json)?$/, "");
  return stripped || trimmed;
}

export async function initializeClient(
  serverUrl: string,
  options: { banner?: boolean } = {}
): Promise<{ client: Client; agentName: string; baseUrl: string }> {
  const baseUrl = normalizeBaseUrl(serverUrl);

  const client = await new ClientFactory().createFromUrl(baseUrl);
  const card: AgentCard = await client.getAgentCard();
  const agentName = card.name || "Agent";

  if (options.banner) {
    console.log(colorize("green", "✓ Agent card found:"));
    console.log(`  Name:      ${colorize("bright", agentName)}`);
    if (card.description) console.log(`  About:     ${card.description}`);
    console.log(`  Version:   ${card.version || "N/A"}`);
    console.log(
      `  Streaming: ${
        card.capabilities?.streaming
          ? colorize("green", "supported")
          : colorize("yellow", "not advertised")
      }`
    );
  }

  return { client, agentName, baseUrl };
}
