import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== ÚLTIMOS REGISTROS DE PONTO ===\n");

  const registros = await prisma.registroPonto.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      colaborador: {
        select: { nomeCompleto: true, id: true }
      }
    }
  });

  console.log(JSON.stringify(registros, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
