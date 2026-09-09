# Cloud Agent base image for c2d-omnichat-be (NestJS + MongoDB + Redis)
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_VERSION=22

# Base system packages required to build native npm modules and fetch tooling.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        git \
        build-essential \
        python3 \
    && rm -rf /var/lib/apt/lists/*

# Node.js (NodeSource) + Yarn classic (matches the repository's yarn.lock).
RUN curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g yarn \
    && rm -rf /var/lib/apt/lists/*

# Redis server + CLI.
RUN apt-get update \
    && apt-get install -y --no-install-recommends redis-server \
    && rm -rf /var/lib/apt/lists/*

# MongoDB 8.0 (official repository for Ubuntu 24.04 "noble").
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
        | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes \
    && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
        > /etc/apt/sources.list.d/mongodb-org-8.0.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends mongodb-org \
    && rm -rf /var/lib/apt/lists/*

# Data/log directories for the local MongoDB and Redis instances, owned by the
# non-root "ubuntu" user that the Cloud Agent runs as.
RUN mkdir -p /var/lib/mongodb /var/log/mongodb /var/run/mongodb \
    && chown -R ubuntu:ubuntu /var/lib/mongodb /var/log/mongodb /var/run/mongodb

USER ubuntu
