import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test users...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const testEmails = ["admin@teste.com", "gerente@teste.com", "rh@teste.com", "colaborador@teste.com"];
  const testCpfs   = ["11111111111", "22222222222", "33333333333", "44444444444"];

  // Busca IDs para deletar dependentes na ordem correta
  const existingColabs = await prisma.colaborador.findMany({
    where: { OR: [{ email: { in: testEmails } }, { cpf: { in: testCpfs } }] },
    select: { id: true },
  });
  const colabIds = existingColabs.map((c) => c.id);

  await prisma.$transaction(async (tx) => {
    if (colabIds.length > 0) {
      await tx.penalidade.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.registroPonto.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.documento.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.premio.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.controleUniforme.deleteMany({ where: { colaboradorId: { in: colabIds } } });
    }
    await tx.user.deleteMany({ where: { email: { in: testEmails } } });
    await tx.colaborador.deleteMany({
      where: { OR: [{ email: { in: testEmails } }, { cpf: { in: testCpfs } }] },
    });

    let loja = await tx.loja.findFirst();
    if (!loja) loja = await tx.loja.create({ data: { nome: "Loja Teste", cidade: "São Paulo" } });

    let setor = await tx.setor.findFirst();
    if (!setor) setor = await tx.setor.create({ data: { nome: "Geral" } });

    let funcao = await tx.funcao.findFirst({ where: { setorId: setor.id } });
    if (!funcao) funcao = await tx.funcao.create({ data: { nome: "Colaborador", setorId: setor.id, salarioBase: 1500 } });

    const testUsers = [
      { name: "Admin Teste",       email: "admin@teste.com",       role: "ADMIN",         cpf: "11111111111" },
      { name: "Gerente Teste",     email: "gerente@teste.com",     role: "STORE_MANAGER", cpf: "22222222222" },
      { name: "RH Teste",          email: "rh@teste.com",          role: "HR_STAFF",      cpf: "33333333333" },
      { name: "Colaborador Teste", email: "colaborador@teste.com", role: "EMPLOYEE",      cpf: "44444444444" },
    ];

    for (const u of testUsers) {
      const colab = await tx.colaborador.create({
        data: {
          nomeCompleto: u.name, cpf: u.cpf, rg: "000000000",
          dataNascimento: new Date("1990-01-01"), email: u.email,
          telefonePrincipal: "11999999999", contaBancoBrasil: "0000-0",
          lojaId: loja.id, setorId: setor.id, funcaoId: funcao.id, status: "ATIVO",
        },
      });
      await tx.user.create({
        data: { name: u.name, email: u.email, password: hashedPassword, role: u.role, lojaId: loja.id, colaboradorId: colab.id },
      });
      console.log(`  ✓ ${u.role.padEnd(14)} → ${u.email}`);
    }
  });

  console.log("\nDone! Password for all: admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
