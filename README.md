# A2A CLI Client

A simple command-line interface (CLI) client for interacting with A2A (Agent-to-Agent) protocol compliant agents. This client provides an interactive terminal interface for sending messages to agents and receiving streaming responses with full support for tasks, contexts, and artifacts.

## Features

- 🚀 **Interactive Terminal Interface**: User-friendly command-line interface with colorized output
- 📡 **Streaming Support**: Real-time streaming of agent responses
- 📝 **Task Management**: Automatic tracking of task IDs and context IDs across conversations
- 🎨 **Rich Output**: Color-coded status indicators and formatted message display
- 📄 **Artifact Support**: Display of artifacts returned by agents
- 🔄 **Session Management**: Easy session reset with `/new` command

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Install from source

```bash
# Clone the repository
git clone <your-repo-url>
cd a2a-cli

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Running the CLI

You can run the CLI in development mode or use the built version:

#### Development mode (with TypeScript)
```bash
npm run dev <agent-url>
```

#### Production mode (compiled JavaScript)
```bash
npm start <agent-url>
```

#### Direct execution
```bash
node dist/cli.js <agent-url>
```

### Example

```bash
# Connect to a local agent
npm run dev http://localhost:8080

# Connect to a remote agent
npm run dev https://api.example.com/agent
```

### Commands

Once connected, you can interact with the agent using the following commands:

- **Send a message**: Simply type your message and press Enter
- **`/new`**: Start a new session (clears task and context IDs)
- **`/exit`**: Exit the CLI

### Interactive Session Example

```
A2A Terminal Client
Agent Base URL: http://localhost:8080
Attempting to connect to agent at: http://localhost:8080
✓ Agent Card Found:
  Name:        Example Agent
  Description: An example A2A agent
  Version:     1.0.0
  Streaming:   Supported

Enter messages, or use '/new' to start a new session. '/exit' to quit.

Example Agent > You: Hello, can you help me?

Example Agent [10:23:45]: ⏳ Status: working (Task: task-123, Context: ctx-456)
Example Agent [10:23:45]: ✉️ Message Stream Event:
  Part 1: 📝 Text: Hello! I'd be happy to help you. What would you like assistance with?

Example Agent > You: /new
✨ Starting new session. Task and Context IDs are cleared.

Example Agent > You: /exit
Exiting A2A Terminal Client. Goodbye!
```

## Development

### Project Structure

```
a2a-cli/
├── src/
│   └── cli.ts          # Main CLI implementation
├── dist/               # Compiled JavaScript output
├── package.json        # Project configuration
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode with tsx
- `npm start` - Run the built version
- `npm run typecheck` - Check TypeScript types without building

### TypeScript Configuration

The project uses TypeScript with the following key configurations:
- Target: ES2022
- Module: CommonJS
- Strict mode enabled
- Source maps for debugging

## Features in Detail

### Streaming Response Handling

The CLI handles various event types from the A2A protocol:

- **Status Updates**: Task state changes (working, completed, failed, etc.)
- **Messages**: Text responses from the agent
- **Artifacts**: Files or data returned by the agent
- **Task Events**: Task lifecycle events

### Color Coding

The CLI uses color coding for better readability:

- 🟦 Blue: Working/In-progress states
- 🟩 Green: Completed/Success states
- 🟨 Yellow: Warnings/Input required
- 🔴 Red: Errors/Failed states
- ⚪ Gray: Metadata and debug information

### Context Persistence

The CLI automatically maintains:
- Current task ID across messages
- Current context ID for conversation continuity
- Session state that can be reset with `/new`

## API Reference

The CLI uses the `@a2a-js/sdk` library to communicate with A2A agents. Key types used:

- `A2AClient`: Main client for agent communication
- `Message`: Message structure with parts (text, files, data)
- `Task`: Task information with status and artifacts
- `AgentCard`: Agent metadata and capabilities

## Error Handling

The CLI provides graceful error handling for:
- Connection failures
- Invalid agent responses
- Network timeouts
- Protocol errors

Errors are displayed with helpful messages and stack traces in debug mode.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC

## Acknowledgments

Built using the [A2A JavaScript SDK](https://github.com/a2aproject/a2a-js) and inspired by the [A2A samples repository](https://github.com/a2aproject/a2a-samples).

## Support

For issues, questions, or suggestions, please open an issue in the repository.