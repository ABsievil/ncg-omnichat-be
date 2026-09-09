#!/usr/bin/env bash
# Development server launcher for the Cloud Agent environment.
# Ensures the local datastores are running, then starts the NestJS watch server
# against the repository's local .env configuration.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Make sure MongoDB and Redis are up before the app boots.
bash "$REPO_ROOT/.cursor/start.sh"

# Run against the repository's local .env datastores (127.0.0.1 MongoDB/Redis
# from .env.example). Any injected managed-service connection secrets
# (e.g. a MongoDB Atlas DATABASE_URL or a remote REDIS_URL) are cleared for
# this process so the local development stack works without external network
# access or IP allowlisting. Remove these `-u` flags if you want dev agents to
# talk to the managed services instead (Atlas requires allowlisting the agent IP).
exec env \
    -u DATABASE_URL \
    -u REDIS_URL \
    -u REDIS_PORT \
    -u REDIS_PASSWORD \
    -u REDIS_DB \
    yarn start:dev
