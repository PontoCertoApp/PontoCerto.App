# Stage 1: Dependências
FROM node:20-slim AS deps
# Instalar dependências para compilar better-sqlite3 se necessário
RUN apt-get update && apt-get install -y python3 make g++ 
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Stage 2: Build
FROM node:20-slim AS builder
# Instalar python3 para o build também (caso precise de rebuild)
RUN apt-get update && apt-get install -y python3 make g++ 
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="file:./dev.db"
ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Importante: DATABASE_URL deve apontar para o volume persistente
ENV DATABASE_URL="file:/data/prod.db"
ENV UPLOAD_DIR="/data/uploads"

# Criar diretórios e dar permissão
USER root
RUN mkdir -p /data/uploads && chmod -R 777 /data

# Copiar os arquivos do build standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/start.sh ./start.sh

# Dar permissão de execução ao script
RUN chmod +x ./start.sh

EXPOSE 3000

# Usar o script de start
CMD ["./start.sh"]
