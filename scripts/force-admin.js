const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'henriquemendonca060502@gmail.com' },
    data: { role: 'ADMIN' }
  });
  console.log('USUÁRIO ATUALIZADO PARA ADMIN:', user.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
