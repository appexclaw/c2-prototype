#!/bin/bash
# Clean test for C2 prototype

kill $(lsof -t -i:4444) 2>/dev/null
sleep 1

cd ~/c2-prototype

# Start server in background
node server.js > /tmp/srv.txt 2>&1 &
SRV=$!
sleep 1

# Start agent in background
node client.js 127.0.0.1 4444 > /tmp/agent.txt 2>&1 &
AGT=$!
sleep 2

# Feed commands to server via stdin file
cat /tmp/cmds.txt | node server.js >> /tmp/srv_out.txt 2>&1 &
CMD=$!
sleep 8

kill $SRV $AGT $CMD 2>/dev/null

echo "=== SERVER OUTPUT ==="
cat /tmp/srv.txt
echo ""
echo "=== COMMAND SESSION ==="
cat /tmp/srv_out.txt
