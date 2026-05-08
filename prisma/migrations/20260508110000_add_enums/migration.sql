-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COLABORADOR', 'GERENTE', 'RH');

-- CreateEnum
CREATE TYPE "ColaboradorStatus" AS ENUM ('ATIVO', 'INATIVO', 'DESLIGADO', 'EM_EXPERIENCIA');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDENTE', 'ENVIADO', 'VALIDADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "PenalidadeStatus" AS ENUM ('ATIVA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PenalidadeTipo" AS ENUM ('INCONSISTENCIA_PONTO', 'QUEDA_CONDUTA', 'ADVERTENCIA', 'SUSPENSAO');

-- CreateEnum
CREATE TYPE "PremioStatus" AS ENUM ('ATIVO', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PontoStatus" AS ENUM ('PENDENTE', 'VALIDADO', 'INCONSISTENTE');

-- CreateEnum
CREATE TYPE "PontoInconformidade" AS ENUM ('FALTA_INJUSTIFICADA', 'ATRASO', 'SAIDA_ANTECIPADA', 'PONTO_NAO_REGISTRADO');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";

-- AlterTable
ALTER TABLE "Colaborador" ALTER COLUMN "status" TYPE "ColaboradorStatus" USING "status"::"ColaboradorStatus";

-- AlterTable
ALTER TABLE "Documento" ALTER COLUMN "status" TYPE "DocumentStatus" USING "status"::"DocumentStatus";

-- AlterTable
ALTER TABLE "Penalidade" ALTER COLUMN "status" TYPE "PenalidadeStatus" USING "status"::"PenalidadeStatus";
ALTER TABLE "Penalidade" ALTER COLUMN "tipo" TYPE "PenalidadeTipo" USING "tipo"::"PenalidadeTipo";

-- AlterTable
ALTER TABLE "Premio" ALTER COLUMN "status" TYPE "PremioStatus" USING "status"::"PremioStatus";

-- AlterTable
ALTER TABLE "RegistroPonto" ALTER COLUMN "status" TYPE "PontoStatus" USING "status"::"PontoStatus";
ALTER TABLE "RegistroPonto" ALTER COLUMN "tipo" TYPE "PontoInconformidade" USING "tipo"::"PontoInconformidade";
