"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/safe-action";
import { z } from "zod";

const updateProfileSchema = z.object({
  image: z.string().optional(),
  name: z.string().optional(),
});

export const updateProfile = createAction(
  updateProfileSchema,
  null, // Any logged in user
  async (data, session) => {
    console.log("[UPDATE_PROFILE] Atualizando usuário:", session.user.id);
    
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: data.image,
        name: data.name,
      },
    });

    // If this user is also a collaborator, update their photo too
    if (user.colaboradorId && data.image) {
      await prisma.colaborador.update({
        where: { id: user.colaboradorId },
        data: { fotoPerfilPath: data.image }
      });
    }

    revalidatePath("/perfil");
    revalidatePath("/dashboard");
    return user;
  }
);
