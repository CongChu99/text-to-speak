FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9.5.0

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY tsconfig.json ./

# Copy backend package files
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @text-to-speak/backend

# Builder stage
FROM base AS builder

COPY packages/backend ./packages/backend

RUN pnpm --filter @text-to-speak/backend build

# Production stage
FROM node:20-alpine AS production

RUN npm install -g pnpm@9.5.0

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY tsconfig.json ./
COPY packages/backend/package.json ./packages/backend/

RUN pnpm install --frozen-lockfile --filter @text-to-speak/backend --prod

COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

WORKDIR /app/packages/backend

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

CMD ["node", "dist/index.js"]
