import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "henriquemendonca060502@gmail.com";
  
  console.log(`Buscando usuário com email: ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.error("Usuário não encontrado!");
    return;
  }

  console.log(`Usuário encontrado: ${user.name} (Role atual: ${user.role})`);
  
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" }
  });

  console.log(`Sucesso! Role atualizada para: ${updatedUser.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
