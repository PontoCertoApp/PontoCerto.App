#!/bin/sh

echo "--- INICIANDO SCRIPT DE START ---"
echo "DATABASE_URL: $DATABASE_URL"
echo "PORT: $PORT"

# Tentar rodar o prisma db push
echo "--- RODANDO PRISMA DB PUSH ---"
npx prisma db push --accept-data-loss
PRISMA_EXIT=$?

if [ $PRISMA_EXIT -ne 0 ]; then
  echo "AVISO: prisma db push falhou com código $PRISMA_EXIT"
  # Não vamos travar o boot por causa disso, o app pode tentar rodar mesmo assim
fi

echo "--- INICIANDO APLICAÇÃO NEXT.JS ---"
# O output standalone gera o arquivo server.js
node server.js
