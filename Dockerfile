FROM oven/bun:1.3 AS build
WORKDIR /app
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:24-bookworm-slim AS web-runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/.output ./.output
USER node
CMD ["node", ".output/server/index.mjs"]

FROM node:24-bookworm-slim AS worker-runtime
ENV NODE_ENV=production
WORKDIR /app
COPY worker ./worker
USER node
CMD ["node", "worker/index.mjs"]
