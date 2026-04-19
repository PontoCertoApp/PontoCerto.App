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
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Criar pasta para dados persistentes e garantir permissões
RUN mkdir -p /data/uploads && chmod -R 777 /data
VOLUME /data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Script para garantir que o banco existe e iniciar o app com logs de diagnóstico
CMD ["sh", "-c", "echo '--- DIAGNOSTICO STARTUP ---' && echo 'Verificando /data:' && ls -ld /data && npx prisma db push && echo '--- PRISMA DB PUSH OK ---' && npm start"]


