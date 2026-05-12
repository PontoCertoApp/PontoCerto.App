import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function list() {
  const users = await prisma.user.findMany();
  console.log("LISTA DE USUÁRIOS:");
  console.table(users.map(u => ({ 
    id: u.id, 
    email: u.email, 
    role: u.role, 
    len: u.email.length 
  })));
}

list()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
