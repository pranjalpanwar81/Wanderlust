#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

DB_PATH="$HOME/mongodb-data"
mkdir -p "$DB_PATH"

if command -v mongod >/dev/null 2>&1; then
  MONGOD_BIN="$(command -v mongod)"
elif [ -x "$HOME/mongodb-macos-aarch64--9.0.0-alpha0-672b778c/bin/mongod" ]; then
  MONGOD_BIN="$HOME/mongodb-macos-aarch64--9.0.0-alpha0-672b778c/bin/mongod"
else
  echo "MongoDB binary not found. Install MongoDB first."
  exit 1
fi

echo "Starting MongoDB..."
if lsof -i :27017 >/dev/null 2>&1; then
  echo "MongoDB is already running."
else
  "$MONGOD_BIN" --dbpath "$DB_PATH" --logpath "$HOME/mongodb.log" --fork >/tmp/wanderlust-mongo.log 2>&1
fi

echo "Starting website..."
if lsof -ti :8080 >/dev/null 2>&1; then
  echo "Port 8080 is already in use. Stopping the existing process..."
  lsof -ti :8080 | xargs -r kill -9
fi
node app.js
