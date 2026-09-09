#!/usr/bin/env bash
# Idempotent repository bootstrap for the Cloud Agent environment.
# Runs after the source is checked out; prepares local config and dependencies.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Provide a local .env for development if one is not already present.
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Install JavaScript dependencies against the committed lockfile.
yarn install --frozen-lockfile
