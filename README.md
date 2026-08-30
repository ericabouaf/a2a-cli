# a2a-cli

A command-line client for agents speaking the [A2A](https://a2a-protocol.org/)
protocol **v1.0** (`@a2a-js/sdk` 1.x). Send messages, follow streaming tasks,
answer questions the agent asks back, and manage tasks from your terminal.

> **v2 is a breaking change.** `--server` now takes the agent's **base URL**
> (not the agent card URL) and the client speaks A2A v1.0 only. For v0.3
> agents, stay on `a2a-cli@1`.

## Installation

```bash
npm install -g a2a-cli
```

Requires Node.js >= 20.

## Quick start

```bash
# Default server is http://localhost:3008
a2a-cli chat

# One-off message, streamed until the task finishes
a2a-cli send "Reply with exactly: pong" --wait

# Another agent
a2a-cli --server https://agent.example.com send "What is the weather?"
```

`--server` is a base URL: the agent card is fetched at
`<url>/.well-known/agent-card.json`. Passing the full card URL also works — the
suffix is stripped for you.

## Commands

### `chat` — interactive session

```bash
a2a-cli chat
a2a-cli --server http://localhost:3008 chat
```

The `contextId` is kept across turns, so the agent remembers the conversation.
The `taskId` is kept **only** while a task is waiting for your input, so your
next line answers the pending question rather than starting a new task.

In-chat commands:

- `/new` — clear both the task and context ids (fresh conversation)
- `/exit` — quit

Works with piped stdin too (reads lines until EOF):

```bash
printf 'What is 2+2?\n/exit\n' | a2a-cli chat
```

### `send` — one-off message

```bash
a2a-cli send "Hello, agent"                    # fire and forget, prints the task id
a2a-cli send "Write a poem" --wait             # stream until done
a2a-cli send < prompt.txt                      # message from stdin

# Continue a conversation, or answer a task parked in input-required
a2a-cli send "blue" --task <task-id> --context <context-id>
```

Options:

- `-w, --wait` — stream the task until it completes, fails, or asks a question
- `-c, --context <id>` — continue an existing conversation (`contextId`)
- `-t, --task <id>` — answer a task waiting in `input-required` (`taskId`)

### `get` / `cancel`

```bash
a2a-cli get <task-id>
a2a-cli get <task-id> --history 10
a2a-cli cancel <task-id>
```

Both print the task id, context id, state name (`COMPLETED`, `CANCELED`, …),
the status message, and any artifacts.

## Interactive tasks (input-required)

When the agent needs you — a question, or a tool permission — the task moves to
`INPUT_REQUIRED` and the stream ends. The CLI shows it as:

```
❓ Which colour do you prefer?
     • red — The colour red
     • blue — The colour blue
```

In `chat`, just type your answer on the next line. Outside of it, reply on the
same task:

```bash
a2a-cli send "blue" --task <task-id> --context <context-id>
```

## Global options

- `-s, --server <url>` — agent base URL (default `http://localhost:3008`)
- `-V, --version`, `-h, --help`

## Development

```bash
npm run dev chat        # tsx, no build
npm run typecheck
npm run build           # -> dist/cli.js
```

## License

ISC
