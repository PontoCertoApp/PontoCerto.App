"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PontoStatus, PontoInconformidade, PenalidadeTipo, PenalidadeStatus } from "@/lib/enums";
import { auth } from "@/auth";

const registroPontoSchema = z.object({
  colaboradorId: z.string(),
  data: z.date(),
  tipo: z.nativeEnum(PontoInconformidade),
  justificativa: z.string().optional(),
  gerarRap: z.boolean().default(false),
});

export async function registrarInconformidade(data: z.infer<typeof registroPontoSchema>) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autorizado" };
  const userId = session.user.id!;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Ponto record
      const registro = await tx.registroPonto.create({
        data: {
          colaboradorId: data.colaboradorId,
          data: data.data,
          tipo: data.tipo,
          justificativa: data.justificativa,
          status: PontoStatus.INCONSISTENTE,
          rapGerado: data.gerarRap,
          criadoPorId: userId,
        },
      });

      // 2. If generarRap, create Penalidade
      if (data.gerarRap) {
        await tx.penalidade.create({
          data: {
            colaboradorId: data.colaboradorId,
            tipo: PenalidadeTipo.INCONSISTENCIA_PONTO,
            descricao: `Penalidade gerada por inconformidade de ponto: ${data.tipo}. Data: ${data.data.toLocaleDateString()}`,
            dataOcorrencia: data.data,
            validadeAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            status: PenalidadeStatus.ATIVA,
            geradoPorId: userId,
            registroPontoId: registro.id,
          },
        });
      }

      return registro;
    });

    revalidatePath("/ponto");
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao registrar ponto" };
  }
}

export async function getInconformidadesDoDia(data: Date) {
  const startOfDay = new Date(data);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(data);
  endOfDay.setHours(23, 59, 59, 999);

  return await prisma.registroPonto.findMany({
    where: {
      data: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      colaborador: {
        include: {
          loja: true,
          funcao: true,
        },
      },
      penalidade: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getColaboradoresSemPontoNoDia(data: Date) {
  // This is a complex query: all active colaboradores minus those who have a point record for the day
  // For this demo/POC, I'll return a subset or empty list to be filled
  const startOfDay = new Date(data);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(data);
  endOfDay.setHours(23, 59, 59, 999);

  const registrados = await prisma.registroPonto.findMany({
    where: { data: { gte: startOfDay, lte: endOfDay } },
    select: { colaboradorId: true },
  });

  const idsRegistrados = registrados.map((r) => r.colaboradorId);

  return await prisma.colaborador.findMany({
    where: {
      status: "ATIVO",
      id: { notIn: idsRegistrados },
    },
    include: {
      loja: true,
      funcao: true,
    },
  });
}
