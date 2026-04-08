FROM node:22-bullseye-slim AS builder

WORKDIR /app

# Activate corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:22-bullseye-slim AS runner
WORKDIR /app

COPY --from=builder /app/.output ./ .output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
