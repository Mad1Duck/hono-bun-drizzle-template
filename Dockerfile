FROM oven/bun:latest

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

WORKDIR /app/apps/gateway

ENV NODE_ENV=production

CMD ["bun", "--env-file=../../.env", "src/index.ts"]
