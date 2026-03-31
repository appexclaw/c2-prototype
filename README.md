# C2 Prototype — Node.js Command & Control

A lightweight Command & Control (C2) prototype built with Node.js and WebSockets.
Built for learning purposes — understanding how RATs, remote admin tools, and
employee monitoring software work under the hood.

## Architecture

```
Operator (server.js)
     │
     │  WebSocket (port 4444)
     ▼
  Agent (client.js)
```

- **Server** — CLI operator console. Type commands, get output back.
- **Agent** — Connects to server, executes commands, returns results. Auto-reconnects if disconnected.

## Features

- Real-time two-way communication via WebSocket
- Run any shell command on the agent
- Download files via curl
- Download + execute remote scripts
- Multi-agent support (connect multiple agents)
- Auto-reconnect on disconnect
- Agent sends host info on connect

## Setup

```bash
npm install
```

## Usage

**Terminal 1 — Start Server:**
```bash
node server.js
```

**Terminal 2 — Start Agent:**
```bash
node client.js 127.0.0.1 4444
```

For remote agents, replace `127.0.0.1` with your server's IP.

## Server Commands

```
list                  — List connected agents
use <id>              — Select an agent
exec <cmd>            — Run shell command on selected agent
download <url>        — Download a file via curl on agent
run <url>             — Download + execute a script on agent
broadcast <cmd>       — Send command to ALL agents
help                  — Show all commands
exit                  — Shutdown server

(or just type any shell command directly — it runs on selected agent)
```

## Example Session

```
[*] C2 Server started on port 4444
[+] Agent #1 connected | IP: 192.168.1.50
[Agent #1] Agent online | Host: workstation | OS: linux | User: john

Agent#1> whoami
john

Agent#1> uname -r
6.1.0-kali9-amd64

Agent#1> download https://example.com/file.txt
Saved to /tmp/file.txt
```

## Disclaimer

This tool is for educational purposes and authorized testing only.
Only use on systems you own or have explicit written permission to test.
Unauthorized use is illegal.

## License

MIT
