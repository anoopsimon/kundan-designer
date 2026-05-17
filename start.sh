#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$OPENAI_API_KEY" ]; then
  echo "ERROR: OPENAI_API_KEY is not set."
  echo "Run:  export OPENAI_API_KEY=sk-..."
  exit 1
fi

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

"$ROOT_DIR/start-backend.sh" &
BACKEND_PID=$!

"$ROOT_DIR/start-frontend.sh" &
FRONTEND_PID=$!

wait -n "$BACKEND_PID" "$FRONTEND_PID"
