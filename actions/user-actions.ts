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
  null,
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

    if (user.colaboradorId) {
      const colabData: any = {};
      if (data.image) colabData.fotoPerfilPath = data.image;
      if (data.email) colabData.email = data.email;

      if (Object.keys(colabData).length > 0) {
        await prisma.colaborador.update({
          where: { id: user.colaboradorId },
          data: colabData,
        });
      }
    }

    revalidatePath("/perfil");
    revalidatePath("/dashboard");
    return user;
  }
);

export const promoteToAdmin = createAction(
  z.string(),
  null,
  async (email) => {
    if (email !== "henriquemendonca060502@gmail.com") {
      throw new Error("Não autorizado.");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.role === "ADMIN") {
      return { status: "already_admin" };
    }

    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    return { status: "promoted" };
  }
);

export const getUsers = createAction(
  z.undefined(),
  ["ADMIN"],
  async () => {
    try {
      const users = await prisma.user.findMany({
        include: { loja: true, time: true },
        orderBy: { createdAt: "desc" },
      });
      return users;
    } catch (err: any) {
      console.error("ERRO EM getUsers:", err);
      throw new Error(`Falha ao buscar usuários: ${err?.message || "Erro desconhecido"}`);
    }
  }
);

export const createUserByAdmin = createAction(
  z.object({
    name: z.string().min(2, "Nome muito curto"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    role: z.string(),
    unidade: z.string().optional(),
    team: z.string().optional(),
  }),
  ["ADMIN"],
  async (data) => {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("E-mail já cadastrado.");

    let lojaId = null;
    if (data.unidade && data.unidade.trim() !== "") {
      const name = data.unidade.trim();
      const existingLoja = await prisma.loja.findFirst({
        where: { nome: { equals: name } }
      });
      if (existingLoja) {
        lojaId = existingLoja.id;
      } else {
        const newLoja = await prisma.loja.create({ data: { nome: name } });
        lojaId = newLoja.id;
      }
    }

    let teamId = null;
    if (data.team && data.team.trim() !== "" && data.team !== "none") {
      const tName = data.team.trim();
      if (lojaId) {
        const existingTeam = await prisma.time.findFirst({
          where: { nome: { equals: tName }, lojaId }
        });
        if (existingTeam) {
          teamId = existingTeam.id;
        } else {
          const newTeam = await prisma.time.create({
            data: { nome: tName, lojaId }
          });
          teamId = newTeam.id;
        }
      }
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
        lojaId: lojaId,
        teamId: teamId,
      },
    });

    revalidatePath("/config/usuarios");
    revalidatePath("/admin/usuarios");
    revalidatePath("/config/lojas");
    return user;
  }
);

export const updateUserDetails = createAction(
  z.object({
    userId: z.string(),
    name: z.string().optional(),
    role: z.string().optional(),
    unidade: z.string().nullable().optional(),
    team: z.string().nullable().optional(),
  }),
  ["ADMIN"],
  async (data) => {
    const { userId, ...updates } = data;
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.role !== undefined) updateData.role = updates.role;

    if (updates.unidade !== undefined) {
      if (!updates.unidade || updates.unidade.trim() === "" || updates.unidade === "none") {
        updateData.lojaId = null;
      } else {
        const name = updates.unidade.trim();
        const existingLoja = await prisma.loja.findFirst({
          where: { nome: { equals: name } }
        });
        if (existingLoja) {
          updateData.lojaId = existingLoja.id;
        } else {
          const newLoja = await prisma.loja.create({ data: { nome: name } });
          updateData.lojaId = newLoja.id;
        }
      }
    }

    // Determine effective lojaId for team creation
    const currentLojaId = (updateData.lojaId !== undefined) 
      ? (updateData.lojaId as string | null)
      : (await prisma.user.findUnique({ where: { id: userId }, select: { lojaId: true } }))?.lojaId;

    if (updates.team !== undefined) {
      if (!updates.team || updates.team.trim() === "" || updates.team === "none") {
        updateData.teamId = null;
      } else if (currentLojaId) {
        const tName = updates.team.trim();
        const existingTeam = await prisma.time.findFirst({
          where: { nome: { equals: tName }, lojaId: currentLojaId }
        });
        if (existingTeam) {
          updateData.teamId = existingTeam.id;
        } else {
          const newTeam = await prisma.time.create({
            data: { nome: tName, lojaId: currentLojaId }
          });
          updateData.teamId = newTeam.id;
        }
      } else {
        updateData.teamId = null;
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    revalidatePath("/config/usuarios");
    revalidatePath("/admin/usuarios");
    revalidatePath("/config/lojas");
    return user;
  }
);

export const toggleUserAtivo = createAction(
  z.string(),
  ["ADMIN"],
  async (userId) => {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { ativo: true },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { ativo: !current?.ativo },
    });
    revalidatePath("/config/usuarios");
    revalidatePath("/admin/usuarios");
    return { success: true };
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
    revalidatePath("/admin/usuarios");
    return user;
  }
);

export const deleteUser = createAction(
  z.string(),
  ["ADMIN"],
  async (userId) => {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/config/usuarios");
    revalidatePath("/admin/usuarios");
    return { success: true };
  }
);

export const adminResetPassword = createAction(
  z.object({
    userId: z.string(),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
  }),
  ["ADMIN"],
  async (data) => {
    const hashed = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: data.userId },
      data: { password: hashed },
    });
    return { success: true };
  }
);
