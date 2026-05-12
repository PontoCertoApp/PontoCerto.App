import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: "henriquemendonca060502@gmail.com" },
    select: { email: true, role: true }
  });
  console.log("STATUS ATUAL NO BANCO:");
  console.log(user);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
