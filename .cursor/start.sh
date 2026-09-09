#!/usr/bin/env bash
# Per-boot startup: bring up the local MongoDB and Redis instances the app
# depends on. Idempotent and safe to re-run.
set -euo pipefail

# MongoDB
if ! pgrep -x mongod >/dev/null 2>&1; then
    mongod \
        --dbpath /var/lib/mongodb \
        --bind_ip 127.0.0.1 \
        --port 27017 \
        --fork \
        --logpath /var/log/mongodb/mongod.log
fi

# Redis
if ! pgrep -x redis-server >/dev/null 2>&1; then
    redis-server --daemonize yes --bind 127.0.0.1 --port 6379
fi

# Wait for MongoDB to accept connections.
for _ in $(seq 1 30); do
    if mongosh --quiet --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1; then
        echo "MongoDB is ready."
        break
    fi
    sleep 1
done

# Wait for Redis to accept connections.
for _ in $(seq 1 30); do
    if redis-cli ping >/dev/null 2>&1; then
        echo "Redis is ready."
        break
    fi
    sleep 1
done
