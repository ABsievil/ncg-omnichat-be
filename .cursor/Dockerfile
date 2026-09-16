# Cloud Agent base image for the Omnichat NestJS backend.
# Bundles the stable system dependencies the app needs: Node.js 22, Yarn,
# MongoDB and Redis. Project dependencies are installed later by the
# repository install script so they track the checked-out lockfile.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Base tooling (git and curl are required in fully custom images).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        git \
        tzdata \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22 (matches the toolchain the project builds against) + Yarn classic.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g yarn \
    && rm -rf /var/lib/apt/lists/*

# Redis server (used for caching / session state).
RUN apt-get update \
    && apt-get install -y --no-install-recommends redis-server \
    && rm -rf /var/lib/apt/lists/*

# MongoDB 8.0 (primary datastore) from the official MongoDB apt repository.
RUN curl -fsSL https://pgp.mongodb.com/server-8.0.asc \
        | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor \
    && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
        > /etc/apt/sources.list.d/mongodb-org-8.0.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends mongodb-org \
    && rm -rf /var/lib/apt/lists/*

# Run as the unprivileged `ubuntu` user (uid 1000) that ships with the base
# image. MongoDB and Redis data live under the user's home directory (created
# by the start script), so no additional root-owned directories are needed.
USER ubuntu
