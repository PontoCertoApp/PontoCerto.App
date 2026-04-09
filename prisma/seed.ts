import { PrismaClient, Role, ColaboradorStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // 1. Create Default Store
  const lojaMatriz = await prisma.loja.upsert({
    where: { id: "matriz" }, // Using id as a dummy check or just use create
    update: {},
    create: {
      id: "matriz",
      nome: "Loja Matriz",
      cidade: "São Paulo",
    },
  });

  // 2. Create Default Sector
  const setorRH = await prisma.setor.upsert({
    where: { id: "rh" },
    update: {},
    create: {
      id: "rh",
      nome: "Recursos Humanos",
    },
  });

  // 3. Create Default Function
  const funcaoRH = await prisma.funcao.upsert({
    where: { id: "analista-rh" },
    update: {},
    create: {
      id: "analista-rh",
      nome: "Analista de RH",
      setorId: setorRH.id,
      salarioBase: 3500.0,
    },
  });

  // 4. Create RH Colaborador
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const rhColaborador = await prisma.colaborador.upsert({
    where: { cpf: "00000000000" },
    update: {},
    create: {
      nomeCompleto: "Administrador RH",
      cpf: "00000000000",
      rg: "000000000",
      dataNascimento: new Date("1990-01-01"),
      email: "admin@pontocerto.com",
      telefonePrincipal: "11999999999",
      contaBancoBrasil: "0000-0",
      lojaId: lojaMatriz.id,
      setorId: setorRH.id,
      funcaoId: funcaoRH.id,
      status: ColaboradorStatus.ATIVO,
    },
  });

  // 5. Create System User for RH
  await prisma.user.upsert({
    where: { email: "admin@pontocerto.com" },
    update: {
      password: hashedPassword,
      role: Role.RH,
    },
    create: {
      name: "Admin RH",
      email: "admin@pontocerto.com",
      password: hashedPassword,
      role: Role.RH,
      lojaId: lojaMatriz.id,
      colaboradorId: rhColaborador.id,
    },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
