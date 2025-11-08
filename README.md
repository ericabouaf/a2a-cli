# a2a-cli

A command-line interface for interacting with A2A (Agent-to-Agent) protocol compliant agents. Send messages, manage tasks, and chat interactively with agents from your terminal.

## Installation

```bash
npm install -g a2a-cli
```

## Quick Start

```bash
# Start an interactive chat session
a2a-cli chat

# Send a one-off message
a2a-cli send "Hello, agent"

# Send with custom server
a2a-cli --server http://localhost:8000 send "What is the weather?"
```

## Commands

### `chat` - Interactive Chat Session

Start an interactive conversation with the agent:

```bash
a2a-cli chat
a2a-cli --server http://localhost:8000 chat
```

**In-chat commands:**
- `/new` - Start a fresh session (clears task and context IDs)
- `/exit` - Exit the chat session

**Example session:**
```
A2A Terminal Client
Agent Base URL: http://localhost:41241
✓ Agent Card Found:
  Name:        Example Agent
  Streaming:   Supported

Example Agent > You: Hello, can you help me?

Example Agent [10:23:45]: ⏳ Status: working
Example Agent [10:23:45]: ✉️ Message:
  📝 Text: Hello! I'd be happy to help you.

Example Agent > You: /exit
Exiting A2A Terminal Client. Goodbye!
```

### `send` - Send a Message

Send a one-off message to the agent:

```bash
# Send a message directly
a2a-cli send "Hello, agent"

# Wait for task completion (streaming mode)
a2a-cli send "Generate a list of 5 movie recommendations" --wait

# Send from stdin
a2a-cli send < prompt-file.txt
cat prompt-file.txt | a2a-cli send

# With custom server
a2a-cli --server http://localhost:8000 send "What's the time?"
```

**Options:**
- `-w, --wait` - Wait for task completion using streaming mode (default: false)

### `get` - Get Task Details

Retrieve details about a specific task:

```bash
a2a-cli get <task-id>
```

**Output includes:**
- Task ID and Context ID
- Current status
- Status messages
- Artifacts (if any)

### `cancel` - Cancel a Task

Cancel a running task:

```bash
a2a-cli cancel <task-id>
```

## Global Options

- `-s, --server <url>` - Agent server URL (default: `http://localhost:41241`)
- `-V, --version` - Output the version number
- `-h, --help` - Display help information

## Usage Examples

```bash
# Interactive chat with default server
a2a-cli chat

# Interactive chat with custom server
a2a-cli --server http://localhost:8000 chat

# Send a quick message (fire and forget)
a2a-cli send "What is 2+2?"

# Send and wait for completion
a2a-cli send "Write me a poem" --wait

# Send from a file
a2a-cli send < my-prompt.txt

# Get task information
a2a-cli get task-abc-123

# Cancel a long-running task
a2a-cli cancel task-abc-123

# Chain commands
a2a-cli --server http://localhost:8000 send "Generate code" --wait > output.txt
```

## Features

- 🚀 **Multiple command modes**: Interactive chat or one-off messages
- 📡 **Streaming support**: Real-time agent responses with `--wait` flag
- 📝 **Task management**: Query and cancel tasks
- 🎨 **Rich output**: Color-coded status indicators and formatted messages
- 📄 **Artifact support**: Display files and data returned by agents
- 🔄 **Context persistence**: Maintains conversation context in chat mode
- 📥 **Stdin support**: Pipe prompts from files or other commands

## Development

```bash
# Run in development mode
npm run dev chat
npm run dev send "test message"

# Type checking
npm run typecheck

# Build
npm run build
```

## Color Coding

The CLI uses colors for better readability:
- 🟦 **Blue**: Working/In-progress states
- 🟩 **Green**: Completed/Success states
- 🟨 **Yellow**: Warnings/Input required
- 🔴 **Red**: Errors/Failed states
- ⚪ **Gray**: Metadata and timestamps

## License

ISC
