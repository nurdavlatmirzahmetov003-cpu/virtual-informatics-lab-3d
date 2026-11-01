# Virtual informatics lab — one container: the built site + the API (V2-12, V4 §12.2).
# Build:  docker compose build      Run: docker compose up -d   (DEPLOY.md, DEPLOY_GCP.md)
# The database, its backups and Bit's voice cache live in the `lab-data` volume
# (/data — on Google Cloud the VM's persistent disk), never in the image.
# Secrets come from the .env file on the server at run time, never at build time.

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/copy-decoders.mjs scripts/
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    SERVER_PORT=8787 \
    STATIC_DIR=dist \
    DB_FILE=/data/lab.db \
    BACKUP_DIR=/data/backups \
    BIT_VOICE_CACHE_DIR=/data/voice-cache
# the server needs no npm packages: Node built-ins and the shared logic in src/
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src ./src
COPY --from=build /app/scripts/test-resolve.mjs ./scripts/
# no npm install at run time: `npm run server:backup` / `server:create-admin` only call node
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:${SERVER_PORT}/api/health >/dev/null || exit 1
CMD ["node", "--experimental-strip-types", "--import", "./scripts/test-resolve.mjs", "server/main.ts"]
