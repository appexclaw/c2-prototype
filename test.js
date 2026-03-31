// Test operator — sends commands to agent and prints responses
const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:4444');

ws.on('open', () => {
    console.log('[*] Test operator connected\n');

    // Test 1: exec command
    setTimeout(() => {
        console.log('[>] TEST 1: exec whoami && hostname && uname -r');
        ws.send(JSON.stringify({ type: 'exec', cmd: 'whoami && hostname && uname -r' }));
    }, 500);

    // Test 2: download a file via curl
    setTimeout(() => {
        console.log('\n[>] TEST 2: download file via curl');
        ws.send(JSON.stringify({ type: 'download', url: 'https://example.com/index.html' }));
    }, 3000);

    // Test 3: run a simple inline script (echo only, safe)
    setTimeout(() => {
        console.log('\n[>] TEST 3: exec multi-line info gathering');
        ws.send(JSON.stringify({ type: 'exec', cmd: 'echo "=== OS ===" && cat /etc/os-release | head -3 && echo "=== CPU ===" && nproc && echo "=== RAM ===" && free -h | head -2' }));
    }, 6000);

    setTimeout(() => {
        console.log('\n[*] Tests done. Closing.');
        ws.close();
        process.exit(0);
    }, 10000);
});

ws.on('message', (data) => {
    try {
        const msg = JSON.parse(data);
        console.log(`\n✅ Agent Response [${msg.type}]:\n${msg.data}`);
    } catch(e) {
        console.log('Raw:', data);
    }
});

ws.on('error', (err) => {
    console.log('[!] Error:', err.message);
});
