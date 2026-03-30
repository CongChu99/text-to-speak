FROM node:20-alpine AS base

RUN npm install -g pnpm@9.5.0

WORKDIR /app

COPY package.json ./
COPY pnpm-install.yaml ./pnpm-workspace.yaml 2>/dev/null || true

COPY packages/frontend/package.json ./

RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder

COPY packages/frontend ./

RUN pnpm build

# Production stage using Nginx
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
