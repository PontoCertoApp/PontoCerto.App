import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.colaborador.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log('Status Counts:', JSON.stringify(counts, null, 2));
  
  const sample = await prisma.colaborador.findMany({
    take: 5,
    select: { id: true, nomeCompleto: true, status: true }
  });
  console.log('Sample Colaboradores:', JSON.stringify(sample, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
