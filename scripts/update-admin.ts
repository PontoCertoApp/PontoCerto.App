import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function update() {
  const user = await prisma.user.update({
    where: { email: "henriquemendonca060502@gmail.com" },
    data: { role: "ADMIN" }
  });
  console.log("SUCESSO! USUÁRIO ATUALIZADO:");
  console.log({ email: user.email, role: user.role });
}

update()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
