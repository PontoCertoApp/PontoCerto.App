-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cidade" TEXT
);

-- CreateTable
CREATE TABLE "Setor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Funcao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "setorId" TEXT NOT NULL,
    "salarioBase" REAL NOT NULL,
    CONSTRAINT "Funcao_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT NOT NULL,
    "dataNascimento" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Colaborador_funcaoId_fkey" FOREIGN KEY ("funcaoId") REFERENCES "Funcao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Colaborador_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Colaborador_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLABORADOR',
    "lojaId" TEXT,
    "colaboradorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colaboradorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "validadoPorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Documento_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Documento_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroPonto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colaboradorId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "tipo" TEXT,
    "justificativa" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "rapGerado" BOOLEAN NOT NULL DEFAULT false,
    "criadoPorId" TEXT NOT NULL,
    "lojaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroPonto_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroPonto_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroPonto_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Penalidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colaboradorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataOcorrencia" DATETIME NOT NULL,
    "validadeAte" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "geradoPorId" TEXT NOT NULL,
    "notificacaoEnviada" BOOLEAN NOT NULL DEFAULT false,
    "registroPontoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Penalidade_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Penalidade_geradoPorId_fkey" FOREIGN KEY ("geradoPorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Penalidade_registroPontoId_fkey" FOREIGN KEY ("registroPontoId") REFERENCES "RegistroPonto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Premio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colaboradorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorOriginal" REAL NOT NULL,
    "valorFinal" REAL NOT NULL,
    "dataReferencia" DATETIME NOT NULL,
    "validadeAte" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "editadoPorId" TEXT,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Premio_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Premio_editadoPorId_fkey" FOREIGN KEY ("editadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ControleUniforme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colaboradorId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "tamanho" TEXT NOT NULL,
    "dataRecebimento" DATETIME NOT NULL,
    "dataTrocaPrevista" DATETIME,
    "devolvido" BOOLEAN NOT NULL DEFAULT false,
    "fotoDevolucaoPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ControleUniforme_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstoqueUniforme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lojaId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "tamanho" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EstoqueUniforme_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PremioTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UniformeTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FuncaoToPremioTemplate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FuncaoToPremioTemplate_A_fkey" FOREIGN KEY ("A") REFERENCES "Funcao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FuncaoToPremioTemplate_B_fkey" FOREIGN KEY ("B") REFERENCES "PremioTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_FuncaoToUniformeTemplate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FuncaoToUniformeTemplate_A_fkey" FOREIGN KEY ("A") REFERENCES "Funcao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FuncaoToUniformeTemplate_B_fkey" FOREIGN KEY ("B") REFERENCES "UniformeTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_colaboradorId_key" ON "User"("colaboradorId");

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_cpf_key" ON "Colaborador"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_email_key" ON "Colaborador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Penalidade_registroPontoId_key" ON "Penalidade"("registroPontoId");

-- CreateIndex
CREATE UNIQUE INDEX "_FuncaoToPremioTemplate_AB_unique" ON "_FuncaoToPremioTemplate"("A", "B");

-- CreateIndex
CREATE INDEX "_FuncaoToPremioTemplate_B_index" ON "_FuncaoToPremioTemplate"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FuncaoToUniformeTemplate_AB_unique" ON "_FuncaoToUniformeTemplate"("A", "B");

-- CreateIndex
CREATE INDEX "_FuncaoToUniformeTemplate_B_index" ON "_FuncaoToUniformeTemplate"("B");
