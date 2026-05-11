"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { sendBoasVindas } from "@/lib/email/send";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export async function registerUser(data: z.infer<typeof registerSchema>) {
  try {
    const validatedData = registerSchema.parse(data);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { success: false, error: "Este e-mail já está em uso." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create Loja and User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Loja (Company) with a default name
      const loja = await tx.loja.create({
        data: {
          nome: "Minha Empresa",
        },
      });

      // 2. Create the User as RH linked to the new Loja
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: "ADMIN", // Default role for registering user (Company Owner)
          lojaId: loja.id,
        },
      });

      return { user, loja };
    });

    // Send welcome email asynchronously
    sendBoasVindas(result.user.email as string, {
      nomeUsuario: result.user.name || "Usuário",
      empresa: result.loja.nome,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://pontocertoapp-pontocertoapp.xyzjfn.easypanel.host"}/login`
    }).catch(err => console.error("[WELCOME_EMAIL_ERROR]:", err));

    return { 
      success: true, 
      message: "Conta criada com sucesso!",
      data: {
        userId: result.user.id,
        lojaId: result.loja.id
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Registration error:", error);
    return { success: false, error: "Ocorreu um erro ao processar seu cadastro." };
  }
}

export async function loginUser(data: any) {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "E-mail ou senha inválidos." };
        default:
          return { success: false, error: "Ocorreu um erro na autenticação." };
      }
    }
    throw error;
  }
}
export async function seedTestUsers() {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ensure Store
      let loja = await tx.loja.findFirst();
      if (!loja) {
        loja = await tx.loja.create({ data: { nome: "Loja Teste", cidade: "São Paulo" } });
      }

      // 2. Ensure Sector
      let setor = await tx.setor.findFirst();
      if (!setor) {
        setor = await tx.setor.create({ data: { nome: "Geral" } });
      }

      // 3. Ensure Function
      let funcao = await tx.funcao.findFirst({ where: { setorId: setor.id } });
      if (!funcao) {
        funcao = await tx.funcao.create({ 
          data: { nome: "Colaborador", setorId: setor.id, salarioBase: 1500 } 
        });
      }

      const testUsers = [
        { name: "Admin Teste", email: "admin@teste.com", role: "ADMIN", cpf: "11111111111" },
        { name: "Gerente Teste", email: "gerente@teste.com", role: "STORE_MANAGER", cpf: "22222222222" },
        { name: "RH Teste", email: "rh@teste.com", role: "HR_STAFF", cpf: "33333333333" },
        { name: "Funcionario Teste", email: "colaborador@teste.com", role: "EMPLOYEE", cpf: "44444444444" },
      ];

      // Cleanup existing test users/colaboradores to avoid unique constraint conflicts
      const testEmails = testUsers.map(u => u.email);
      const testCpfs = testUsers.map(u => u.cpf);

      await tx.user.deleteMany({ where: { email: { in: testEmails } } });
      await tx.colaborador.deleteMany({ 
        where: { 
          OR: [
            { email: { in: testEmails } },
            { cpf: { in: testCpfs } }
          ]
        } 
      });

      for (const u of testUsers) {
        // Create Colaborador
        const colab = await tx.colaborador.create({
          data: {
            nomeCompleto: u.name,
            cpf: u.cpf,
            rg: "000000000",
            dataNascimento: new Date("1990-01-01"),
            email: u.email,
            telefonePrincipal: "11999999999",
            contaBancoBrasil: "0000-0",
            lojaId: loja.id,
            setorId: setor.id,
            funcaoId: funcao.id,
            status: "ATIVO",
          },
        });

        // Create User
        await tx.user.create({
          data: {
            name: u.name,
            email: u.email,
            password: hashedPassword,
            role: u.role,
            lojaId: loja.id,
            colaboradorId: colab.id,
          },
        });
      }
      return true;
    });

    return { success: true, message: "Usuários de teste criados com sucesso!" };
  } catch (error: any) {
    console.error("Seed error:", error);
    return { success: false, error: error.message };
  }
}
