import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 
async function main() { 
  try { 
    const existingLoja = await prisma.loja.findFirst({ where: { nome: { equals: 'teste' } } }); 
    console.log("Success:", existingLoja); 
  } catch(e) { 
    console.error("Error:", e); 
  } finally { 
    await prisma.$disconnect(); 
  } 
} 
main();
