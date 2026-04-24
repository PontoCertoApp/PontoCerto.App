#!/bin/sh
set -e

echo "--- INICIANDO SCRIPT DE START ---"
echo "DATABASE_URL: $DATABASE_URL"
echo "PORT: $PORT"

echo "--- RODANDO PRISMA DB PUSH (v6.2.1) ---"
npx prisma@6.2.1 db push --accept-data-loss

echo "--- INICIANDO APLICAÇÃO NEXT.JS ---"
node server.js
