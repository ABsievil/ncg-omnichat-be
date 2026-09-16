#!/usr/bin/env bash
# Idempotent repository bootstrap: refresh Node dependencies and ensure a
# local .env exists. Runs after the repository is checked out.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# Seed a local environment file from the tracked example if one is not present.
# Existing files are left untouched so custom values survive re-runs.
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

# Install dependencies exactly as pinned by the lockfile.
yarn install --frozen-lockfile

echo "install.sh completed"
