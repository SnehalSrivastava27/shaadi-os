# Shaadi OS on Fly.io: the Next.js app + the WhatsApp bridge (started by instrumentation.ts) in one always-on machine.
FROM node:22-bookworm-slim AS build
WORKDIR /app
# git: Baileys pulls its signal library from GitHub
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY wa-bridge/package.json wa-bridge/package-lock.json wa-bridge/
RUN cd wa-bridge && npm ci --no-audit --no-fund --omit=dev
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app ./
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
