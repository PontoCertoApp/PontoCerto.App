"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PontoStatus, PontoInconformidade, PenalidadeTipo, PenalidadeStatus } from "@/lib/enums";
import { auth } from "@/auth";
import { sendPontoNotification } from "@/lib/email/send";
import { startOfDay, endOfDay } from "date-fns";

const registroPontoSchema = z.object({
  colaboradorId: z.string(),
  manualName: z.string().optional(),
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
    const isManual = data.colaboradorId === "MANUAL";
    let colaborador = null;
    let lojaId = null;

    if (!isManual) {
      colaborador = await prisma.colaborador.findUnique({
        where: { id: data.colaboradorId },
        select: { nomeCompleto: true, email: true, lojaId: true },
      });
      if (!colaborador) throw new Error("Colaborador não encontrado");
      lojaId = colaborador.lojaId;
    }

    const result = await prisma.$transaction(async (tx) => {
      const registro = await tx.registroPonto.create({
        data: {
          colaboradorId: isManual ? userId : data.colaboradorId, // Link to creator if manual
          lojaId: lojaId,
          data: data.data,
          tipo: data.tipo,
          justificativa: isManual ? `[MANUAL: ${data.manualName}] ${data.justificativa || ""}` : data.justificativa,
          status: PontoStatus.INCONSISTENTE,
          rapGerado: data.gerarRap,
          criadoPorId: userId,
        },
      });

      if (data.gerarRap) {
        await tx.penalidade.create({
          data: {
            colaboradorId: data.colaboradorId,
            tipo: PenalidadeTipo.INCONSISTENCIA_PONTO,
            descricao: `Penalidade gerada por inconformidade de ponto: ${data.tipo}. Data: ${data.data.toLocaleDateString()}`,
            dataOcorrencia: data.data,
            validadeAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: PenalidadeStatus.ATIVA,
            geradoPorId: userId,
            registroPontoId: registro.id,
          },
        });
      }

      return registro;
    });

    // Fire-and-forget email notification
    if (colaborador?.email) {
      sendPontoNotification(colaborador.email, {
        colaboradorNome: colaborador.nomeCompleto,
        email: colaborador.email,
        data: data.data.toLocaleDateString("pt-BR"),
        tipo: data.tipo,
        justificativa: data.justificativa,
        rapGerado: data.gerarRap,
      }).catch((err) => console.error("[email/ponto] Falha:", err));
    }

    revalidatePath("/ponto");
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao registrar ponto" };
  }
}

export async function getInconformidadesDoDia(data: Date) {
  try {
    const session = await auth();
    if (!session?.user) return [];

    const isRH = session.user.role === "RH";
    const targetLojaId = session.user.lojaId;

    const inicioDia = startOfDay(data);
    const fimDia = endOfDay(data);

    return await prisma.registroPonto.findMany({
      where: {
        data: { gte: inicioDia, lte: fimDia },
        ...(isRH ? {} : { colaborador: { lojaId: targetLojaId } })
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
  } catch (error) {
    console.error("[GET_INCONFORMIDADES_ERROR]:", error);
    return [];
  }
}

export async function getColaboradoresSemPontoNoDia(data: Date) {
  try {
    const session = await auth();
    if (!session?.user) return [];

    const isRH = session.user.role === "RH";
    const targetLojaId = session.user.lojaId;

    const inicioDia = startOfDay(data);
    const fimDia = endOfDay(data);

    const registrosNoDia = await prisma.registroPonto.findMany({
      where: {
        data: { gte: inicioDia, lte: fimDia },
        ...(isRH ? {} : { colaborador: { lojaId: targetLojaId } })
      },
      select: { colaboradorId: true },
    });

    const idsRegistrados = registrosNoDia.map((r) => r.colaboradorId);

    return await prisma.colaborador.findMany({
      where: {
        status: { in: ["ATIVO", "EM_EXPERIENCIA"] },
        id: { notIn: idsRegistrados },
        ...(isRH ? {} : { lojaId: targetLojaId })
      },
      include: {
        loja: true,
        funcao: true,
        setor: true,
      },
      orderBy: { nomeCompleto: "asc" },
    });
  } catch (error) {
    console.error("[GET_COLABS_SEM_PONTO_ERROR]:", error);
    return [];
  }
}

export async function getTotalAtivos() {
  try {
    const session = await auth();
    if (!session?.user) return 0;
    
    const isRH = session.user.role === "RH";
    
    if (isRH) {
      return await prisma.colaborador.count({
        where: { status: { in: ["ATIVO", "EM_EXPERIENCIA"] } },
      });
    }

    const lojaId = session.user.lojaId;
    if (!lojaId) return 0;
    
    return await prisma.colaborador.count({
      where: {
        lojaId,
        status: { in: ["ATIVO", "EM_EXPERIENCIA"] },
      },
    });
  } catch (error) {
    console.error("[GET_TOTAL_ATIVOS_ERROR]:", error);
    return 0;
  }
}
