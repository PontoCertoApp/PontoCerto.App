import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding specific user...");

  // 1. Create Default Store
  const loja = await prisma.loja.upsert({
    where: { id: "matriz" },
    update: {},
    create: {
      id: "matriz",
      nome: "Loja Matriz",
      cidade: "São Paulo",
    },
  });

  // 2. Create Default Sector
  const setor = await prisma.setor.upsert({
    where: { id: "admin-setor" },
    update: {},
    create: {
      id: "admin-setor",
      nome: "Administração",
    },
  });

  // 3. Create Default Function
  const funcao = await prisma.funcao.upsert({
    where: { id: "admin-funcao" },
    update: {},
    create: {
      id: "admin-funcao",
      nome: "Administrador do Sistema",
      setorId: setor.id,
      salarioBase: 5000.0,
    },
  });

  // 4. Create Colaborador
  const colaborador = await prisma.colaborador.upsert({
    where: { cpf: "12345678900" },
    update: {},
    create: {
      nomeCompleto: "Henrique Mendonça",
      cpf: "12345678900",
      rg: "123456789",
      dataNascimento: new Date("2002-05-06"),
      email: "henriquemendonca060502@gmail.com",
      telefonePrincipal: "11999999999",
      contaBancoBrasil: "12345-6",
      lojaId: loja.id,
      setorId: setor.id,
      funcaoId: funcao.id,
      status: "ATIVO",
    },
  });

  // 5. Create User
  const hashedPassword = await bcrypt.hash("@Hb060502", 10);

  await prisma.user.upsert({
    where: { email: "henriquemendonca060502@gmail.com" },
    update: {
      password: hashedPassword,
      role: "RH", // Giving RH role so they have full access
    },
    create: {
      name: "Henrique Mendonça",
      email: "henriquemendonca060502@gmail.com",
      password: hashedPassword,
      role: "RH",
      lojaId: loja.id,
      colaboradorId: colaborador.id,
    },
  });

  console.log("Seed completed! User 'henriquemendonca060502@gmail.com' created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
