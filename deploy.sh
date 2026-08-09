#!/usr/bin/env bash
# Deploy on VPS after CI pushed image to GHCR and SCP'd compose files.
# Required: IMAGE_NAME, IMAGE_TAG
# Optional: APP_DIR, REGISTRY_HOST, REGISTRY_USERNAME, REGISTRY_TOKEN

set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
cd "$APP_DIR"

if [[ -z "${IMAGE_NAME:-}" || -z "${IMAGE_TAG:-}" ]]; then
  echo "IMAGE_NAME and IMAGE_TAG are required"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Missing .env in $APP_DIR"
  exit 1
fi

if [[ -n "${REGISTRY_HOST:-}" && -n "${REGISTRY_USERNAME:-}" && -n "${REGISTRY_TOKEN:-}" ]]; then
  echo "$REGISTRY_TOKEN" | docker login "$REGISTRY_HOST" -u "$REGISTRY_USERNAME" --password-stdin
fi

export API_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

docker compose pull api worker
docker compose up -d --no-build --remove-orphans

echo "Deploy OK: ${API_IMAGE}"
