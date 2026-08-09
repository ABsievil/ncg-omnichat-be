FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY . .
RUN yarn build

FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8090

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production && yarn cache clean && chown -R node:node /app

COPY --from=builder --chown=node:node /app/dist ./dist
# nestjs-i18n loads from process.cwd()/src/languages
COPY --from=builder --chown=node:node /app/src/languages ./src/languages

USER node

EXPOSE 8090

CMD ["node", "dist/main.js"]
