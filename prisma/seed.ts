import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test users...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 1. Ensure store
  let loja = await prisma.loja.findFirst();
  if (!loja) {
    loja = await prisma.loja.create({ data: { nome: "Loja Teste", cidade: "São Paulo" } });
  }

  // 2. Ensure sector
  let setor = await prisma.setor.findFirst();
  if (!setor) {
    setor = await prisma.setor.create({ data: { nome: "Geral" } });
  }

  // 3. Ensure function
  let funcao = await prisma.funcao.findFirst({ where: { setorId: setor.id } });
  if (!funcao) {
    funcao = await prisma.funcao.create({
      data: { nome: "Colaborador", setorId: setor.id, salarioBase: 1500 },
    });
  }

  const testUsers = [
    { name: "Admin Teste",       email: "admin@teste.com",       role: "ADMIN",         cpf: "11111111111" },
    { name: "Gerente Teste",     email: "gerente@teste.com",     role: "STORE_MANAGER", cpf: "22222222222" },
    { name: "RH Teste",          email: "rh@teste.com",          role: "HR_STAFF",      cpf: "33333333333" },
    { name: "Colaborador Teste", email: "colaborador@teste.com", role: "EMPLOYEE",      cpf: "44444444444" },
  ];

  // Clean up existing test data to avoid conflicts
  const emails = testUsers.map((u) => u.email);
  const cpfs   = testUsers.map((u) => u.cpf);

  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.colaborador.deleteMany({
    where: { OR: [{ email: { in: emails } }, { cpf: { in: cpfs } }] },
  });

  for (const u of testUsers) {
    const colab = await prisma.colaborador.create({
      data: {
        nomeCompleto:      u.name,
        cpf:               u.cpf,
        rg:                "000000000",
        dataNascimento:    new Date("1990-01-01"),
        email:             u.email,
        telefonePrincipal: "11999999999",
        contaBancoBrasil:  "0000-0",
        lojaId:            loja.id,
        setorId:           setor.id,
        funcaoId:          funcao.id,
        status:            "ATIVO",
      },
    });

    await prisma.user.create({
      data: {
        name:         u.name,
        email:        u.email,
        password:     hashedPassword,
        role:         u.role,
        lojaId:       loja.id,
        colaboradorId: colab.id,
      },
    });

    console.log(`  ✓ ${u.role.padEnd(14)} → ${u.email}`);
  }

  console.log("\nDone! Password for all: admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
