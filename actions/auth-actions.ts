"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  companyName: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
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
      // 1. Create the Loja (Company)
      const loja = await tx.loja.create({
        data: {
          nome: validatedData.companyName,
        },
      });

      // 2. Create the User as RH linked to the new Loja
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: "RH", // Default role for registering user
          lojaId: loja.id,
        },
      });

      return { user, loja };
    });

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
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "E-mail ou senha inválidos." };
        default:
          return { success: false, error: "Ocorreu um erro na autenticação." };
      }
    }
    // IMPORTANTE: Re-lançar o erro para que o Next.js trate o redirecionamento
    throw error;
  }
}
