# Build dari root monorepo:
#   docker build -f apps/api/Dockerfile -t keytabee-api .
FROM node:22-alpine AS base
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile --filter api...
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

FROM base AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo ./
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter api exec prisma migrate deploy && node apps/api/dist/main"]
