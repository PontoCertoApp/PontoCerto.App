-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT,

    CONSTRAINT "Loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Setor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "setorId" TEXT NOT NULL,
    "salarioBase" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Funcao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "enderecoComprovantePath" TEXT,
    "telefonePrincipal" TEXT NOT NULL,
    "telefoneSecundario" TEXT,
    "email" TEXT,
    "pisFotoPath" TEXT,
    "historicoEscolarPath" TEXT,
    "ctpsDigitalPath" TEXT,
    "contaBancoBrasil" TEXT NOT NULL,
    "possuiFilhosMenores14" BOOLEAN NOT NULL DEFAULT false,
    "certidaoFilhosPath" TEXT,
    "fotoPerfilPath" TEXT,
    "contratoAssinadoPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EM_EXPERIENCIA',
    "funcaoId" TEXT NOT NULL,
    "setorId" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLABORADOR',
    "lojaId" TEXT,
    "colaboradorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "validadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroPonto" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT,
    "justificativa" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "rapGerado" BOOLEAN NOT NULL DEFAULT false,
    "criadoPorId" TEXT NOT NULL,
    "lojaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroPonto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalidade" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataOcorrencia" TIMESTAMP(3) NOT NULL,
    "validadeAte" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "geradoPorId" TEXT NOT NULL,
    "notificacaoEnviada" BOOLEAN NOT NULL DEFAULT false,
    "registroPontoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penalidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Premio" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorOriginal" DOUBLE PRECISION NOT NULL,
    "valorFinal" DOUBLE PRECISION NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "validadeAte" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "editadoPorId" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Premio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControleUniforme" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "tamanho" TEXT NOT NULL,
    "dataRecebimento" TIMESTAMP(3) NOT NULL,
    "dataTrocaPrevista" TIMESTAMP(3),
    "devolvido" BOOLEAN NOT NULL DEFAULT false,
    "fotoDevolucaoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControleUniforme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueUniforme" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "tamanho" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstoqueUniforme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PremioTemplate" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "PremioTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniformeTemplate" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "UniformeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable (implicit many-to-many join tables)
CREATE TABLE "_FuncaoToPremioTemplate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE TABLE "_FuncaoToUniformeTemplate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_cpf_key" ON "Colaborador"("cpf");
CREATE UNIQUE INDEX "Colaborador_email_key" ON "Colaborador"("email");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_colaboradorId_key" ON "User"("colaboradorId");
CREATE UNIQUE INDEX "Penalidade_registroPontoId_key" ON "Penalidade"("registroPontoId");
CREATE UNIQUE INDEX "_FuncaoToPremioTemplate_AB_unique" ON "_FuncaoToPremioTemplate"("A", "B");
CREATE INDEX "_FuncaoToPremioTemplate_B_index" ON "_FuncaoToPremioTemplate"("B");
CREATE UNIQUE INDEX "_FuncaoToUniformeTemplate_AB_unique" ON "_FuncaoToUniformeTemplate"("A", "B");
CREATE INDEX "_FuncaoToUniformeTemplate_B_index" ON "_FuncaoToUniformeTemplate"("B");

-- AddForeignKey
ALTER TABLE "Funcao" ADD CONSTRAINT "Funcao_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_funcaoId_fkey" FOREIGN KEY ("funcaoId") REFERENCES "Funcao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Documento" ADD CONSTRAINT "Documento_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RegistroPonto" ADD CONSTRAINT "RegistroPonto_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegistroPonto" ADD CONSTRAINT "RegistroPonto_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegistroPonto" ADD CONSTRAINT "RegistroPonto_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Penalidade" ADD CONSTRAINT "Penalidade_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Penalidade" ADD CONSTRAINT "Penalidade_geradoPorId_fkey" FOREIGN KEY ("geradoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Penalidade" ADD CONSTRAINT "Penalidade_registroPontoId_fkey" FOREIGN KEY ("registroPontoId") REFERENCES "RegistroPonto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Premio" ADD CONSTRAINT "Premio_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Premio" ADD CONSTRAINT "Premio_editadoPorId_fkey" FOREIGN KEY ("editadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ControleUniforme" ADD CONSTRAINT "ControleUniforme_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EstoqueUniforme" ADD CONSTRAINT "EstoqueUniforme_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "_FuncaoToPremioTemplate" ADD CONSTRAINT "_FuncaoToPremioTemplate_A_fkey" FOREIGN KEY ("A") REFERENCES "Funcao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_FuncaoToPremioTemplate" ADD CONSTRAINT "_FuncaoToPremioTemplate_B_fkey" FOREIGN KEY ("B") REFERENCES "PremioTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_FuncaoToUniformeTemplate" ADD CONSTRAINT "_FuncaoToUniformeTemplate_A_fkey" FOREIGN KEY ("A") REFERENCES "Funcao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_FuncaoToUniformeTemplate" ADD CONSTRAINT "_FuncaoToUniformeTemplate_B_fkey" FOREIGN KEY ("B") REFERENCES "UniformeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
