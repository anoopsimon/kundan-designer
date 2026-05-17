#!/bin/bash
set -e

if [ -z "$OPENAI_API_KEY" ]; then
  echo "ERROR: OPENAI_API_KEY is not set."
  echo "Run:  export OPENAI_API_KEY=sk-..."
  exit 1
fi

cd "$(dirname "$0")/backend"
echo "Starting Kundan Designer backend on http://localhost:8081"
PORT=8081 go run main.go
