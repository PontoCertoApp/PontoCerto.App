"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/safe-action";
import { z } from "zod";

const updateProfileSchema = z.object({
  image: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email("E-mail inválido").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres").optional(),
});

export const updateProfile = createAction(
  updateProfileSchema,
  null, // Any logged in user
  async (data, session) => {
    const updateData: any = {
      image: data.image,
      name: data.name,
      email: data.email,
    };

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new Error("Senha atual é obrigatória para mudar a senha.");
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!currentUser) throw new Error("Usuário não encontrado.");

      const isPasswordValid = await bcrypt.compare(data.currentPassword, currentUser.password);
      if (!isPasswordValid) {
        throw new Error("Senha atual incorreta.");
      }

      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // If this user is also a collaborator, update their photo and email too
    if (user.colaboradorId) {
      const colabData: any = {};
      if (data.image) colabData.fotoPerfilPath = data.image;
      if (data.email) colabData.email = data.email;
      
      if (Object.keys(colabData).length > 0) {
        await prisma.colaborador.update({
          where: { id: user.colaboradorId },
          data: colabData
        });
      }
    }

    revalidatePath("/perfil");
    revalidatePath("/dashboard");
    return user;
  }
);

export const promoteToAdmin = createAction(
  z.string(), // email
  null,
  async (email) => {
    if (email !== 'henriquemendonca060502@gmail.com') {
      throw new Error("Não autorizado.");
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.role === 'ADMIN') {
      return { status: "already_admin" };
    }

    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    return { status: "promoted" };
  }
);

export const getUsers = createAction(
  z.undefined(),
  ["ADMIN"],
  async () => {
    return await prisma.user.findMany({
      include: { loja: true },
      orderBy: { createdAt: "desc" },
    });
  }
);

export const updateUserRole = createAction(
  z.object({ userId: z.string(), role: z.string() }),
  ["ADMIN"],
  async (data) => {
    const user = await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role },
    });
    revalidatePath("/config/usuarios");
    return user;
  }
);

export const deleteUser = createAction(
  z.string(),
  ["ADMIN"],
  async (userId) => {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/config/usuarios");
    return { success: true };
  }
);


