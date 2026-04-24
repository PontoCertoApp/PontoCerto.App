# Stage 1: Dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Stage 2: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner

# libc6-compat é OBRIGATÓRIO para o binário do Prisma query engine no Alpine
RUN apk add --no-cache libc6-compat openssl ca-certificates

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# DATABASE_URL padrão para SQLite persistente — sobrescreva no EasyPanel se necessário
ENV DATABASE_URL="file:/data/prod.db"

# Pasta para banco SQLite e uploads — precisa de volume persistente no EasyPanel
RUN mkdir -p /data/uploads && chmod -R 777 /data
VOLUME /data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Aplica o schema no banco e inicia o servidor
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node_modules/.bin/next start -p 3000"]
