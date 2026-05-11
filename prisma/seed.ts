import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting RBAC seed...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 1. Create Default Store
  const lojaMatriz = await prisma.loja.upsert({
    where: { id: "matriz" },
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

  // Helper to create users
  const users = [
    { name: "Sistema Admin", email: "admin@pontocerto.com", role: "ADMIN" },
    { name: "Gestor Loja", email: "manager@pontocerto.com", role: "STORE_MANAGER" },
    { name: "Staff RH", email: "hr@pontocerto.com", role: "HR_STAFF" },
    { name: "Funcionario", email: "employee@pontocerto.com", role: "EMPLOYEE" },
  ];

  for (const u of users) {
    // Create Colaborador first (to avoid FK issues if needed)
    const colab = await prisma.colaborador.upsert({
      where: { email: u.email },
      update: {},
      create: {
        nomeCompleto: u.name,
        cpf: Math.random().toString().slice(2, 13), // dummy cpf
        rg: "000000000",
        dataNascimento: new Date("1990-01-01"),
        email: u.email,
        telefonePrincipal: "11999999999",
        contaBancoBrasil: "0000-0",
        lojaId: lojaMatriz.id,
        setorId: setorRH.id,
        funcaoId: funcaoRH.id,
        status: "ATIVO",
      },
    });

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: hashedPassword,
        role: u.role,
      },
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        lojaId: lojaMatriz.id,
        colaboradorId: colab.id,
      },
    });
  }

  console.log("RBAC Seed completed! Users created with password 'admin123'");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
