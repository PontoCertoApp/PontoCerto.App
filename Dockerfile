# Base image
FROM node:20-bookworm

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY prisma ./prisma/

# Instalar tudo (incluindo devDeps para o build)
RUN npm install

# Copiar o resto do código
COPY . .

# Variáveis de build
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL="file:./dev.db"

# Gerar o client do Prisma e fazer o build
RUN npx prisma generate
RUN npm run build

# Configurações de produção
ENV NODE_ENV production
ENV PORT 3000
ENV DATABASE_URL="file:/data/prod.db"
ENV UPLOAD_DIR="/data/uploads"

# Preparar o volume de dados
RUN mkdir -p /data/uploads && chmod -R 777 /data
VOLUME /data

EXPOSE 3000

# Script de inicialização robusto
RUN echo '#!/bin/sh\n\
echo "Iniciando PontoCerto..."\n\
echo "Verificando Banco de Dados em $DATABASE_URL"\n\
npx prisma db push --accept-data-loss || echo "Aviso: db push falhou"\n\
echo "Iniciando Next.js na porta $PORT..."\n\
npm start' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
