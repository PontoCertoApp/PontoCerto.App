import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DIAGNÓSTICO BANCO DE DADOS ===\n");

  // 1. Total de colaboradores
  const total = await prisma.colaborador.count();
  console.log("Total de colaboradores:", total);

  // 2. Listar primeiros 5 (select simples)
  const simples = await prisma.colaborador.findMany({
    take: 5,
    select: { id: true, nomeCompleto: true, lojaId: true, funcaoId: true },
  });
  console.log("\nPrimeiros 5 (select simples):");
  console.log(JSON.stringify(simples, null, 2));

  // 3. Testar select com relações (o que getColaboradoresParaPonto faz)
  try {
    const comRelacoes = await prisma.colaborador.findMany({
      take: 5,
      select: {
        id: true,
        nomeCompleto: true,
        loja: { select: { nome: true } },
        funcao: { select: { nome: true } },
      },
    });
    console.log("\nCom relações (select):");
    console.log(JSON.stringify(comRelacoes, null, 2));
  } catch (err: any) {
    console.error("\n❌ ERRO no select com relações:", err.message);
  }

  // 4. Busca por nome
  try {
    const busca = await prisma.colaborador.findMany({
      where: { nomeCompleto: { contains: "Henrique", mode: "insensitive" } },
      select: { id: true, nomeCompleto: true },
    });
    console.log('\nBusca por "Henrique":');
    console.log(JSON.stringify(busca, null, 2));
  } catch (err: any) {
    console.error("\n❌ ERRO na busca por nome:", err.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
