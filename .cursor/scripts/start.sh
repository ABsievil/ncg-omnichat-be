#!/usr/bin/env bash
# Per-boot reconciliation: make sure MongoDB and Redis are running before the
# application terminal starts. Safe to run repeatedly.
set -euo pipefail

DATA_DIR="${OMNICHAT_DATA_DIR:-$HOME/.omnichat-data}"
MONGO_DATA_DIR="$DATA_DIR/mongo"
MONGO_LOG="$DATA_DIR/mongod.log"
REDIS_DATA_DIR="$DATA_DIR/redis"

mkdir -p "$MONGO_DATA_DIR" "$REDIS_DATA_DIR"

# --- MongoDB -----------------------------------------------------------------
if mongosh --quiet --eval 'db.runCommand({ ping: 1 }).ok' \
        "mongodb://127.0.0.1:27017/admin" >/dev/null 2>&1; then
    echo "MongoDB already running"
else
    echo "Starting MongoDB..."
    mongod \
        --dbpath "$MONGO_DATA_DIR" \
        --logpath "$MONGO_LOG" \
        --bind_ip 127.0.0.1 \
        --port 27017 \
        --fork
fi

# --- Redis -------------------------------------------------------------------
if redis-cli ping >/dev/null 2>&1; then
    echo "Redis already running"
else
    echo "Starting Redis..."
    redis-server \
        --daemonize yes \
        --dir "$REDIS_DATA_DIR" \
        --bind 127.0.0.1 \
        --port 6379
fi

# --- Readiness ---------------------------------------------------------------
for _ in $(seq 1 30); do
    if mongosh --quiet --eval 'db.runCommand({ ping: 1 }).ok' \
            "mongodb://127.0.0.1:27017/admin" >/dev/null 2>&1 \
        && redis-cli ping >/dev/null 2>&1; then
        echo "MongoDB and Redis are ready"
        exit 0
    fi
    sleep 1
done

echo "Timed out waiting for MongoDB and/or Redis to become ready" >&2
exit 1
