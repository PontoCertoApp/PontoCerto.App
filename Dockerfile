# Stage 1: Dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variável dummy para o build passar se o prisma precisar
ENV DATABASE_URL="file:./dev.db"
ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Fallback para DATABASE_URL
ENV DATABASE_URL="file:/data/prod.db"
ENV UPLOAD_DIR="/data/uploads"

# Garantir permissões e diretórios
RUN mkdir -p /data/uploads && chmod -R 777 /data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Script de entrada para migração e start
# Usamos o node server.js que é gerado pelo output: standalone
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]
