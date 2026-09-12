FROM oven/bun:1.3 AS build
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/.output ./.output
COPY --from=build /app/worker ./worker
USER node
CMD ["node", ".output/server/index.mjs"]
