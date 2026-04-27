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
  
  console.log("[PONTO_REG] User:", session.user.email, "Role:", session.user.role, "LojaId:", session.user.lojaId);

  try {
    // Normaliza a data para o início do dia para evitar problemas de fuso horário na consulta posterior
    const dataPonto = startOfDay(data.data);
    const isManual = data.colaboradorId === "MANUAL";
    let colaborador = null;
    let lojaId = session.user.lojaId || null;

    if (!isManual) {
      colaborador = await prisma.colaborador.findUnique({
        where: { id: data.colaboradorId },
        select: { id: true, nomeCompleto: true, email: true, lojaId: true },
      });
      if (!colaborador) throw new Error("Colaborador não encontrado");
      lojaId = colaborador.lojaId;
    } else if (data.manualName) {
      // Tenta encontrar por nome exato para evitar duplicidade de "Manual" vs "Existente"
      colaborador = await prisma.colaborador.findFirst({
        where: { nomeCompleto: { equals: data.manualName.trim(), mode: "insensitive" } },
        select: { id: true, nomeCompleto: true, email: true, lojaId: true },
      });
      if (colaborador) {
        lojaId = colaborador.lojaId;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Se encontramos o colaborador (mesmo vindo como MANUAL), usamos o ID dele.
      // Se NÃO encontramos, e a schema exige um ID, somos obrigados a usar o do criador (Admin).
      const finalColabId = colaborador ? colaborador.id : userId;

      const registro = await tx.registroPonto.create({
        data: {
          colaboradorId: finalColabId,
          lojaId: lojaId,
          data: dataPonto, // Usando a data normalizada
          tipo: data.tipo,
          justificativa: !colaborador ? `[MANUAL: ${data.manualName}] ${data.justificativa || ""}` : data.justificativa,
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

    const isRH = ["RH", "ADMIN"].includes((session.user.role || "").toUpperCase());
    const targetLojaId = session.user.lojaId;

    const inicioDia = startOfDay(data);
    const fimDia = endOfDay(data);

    const where: any = {
      data: { gte: inicioDia, lte: fimDia }
    };

    // Se NÃO for RH/ADMIN, filtra pela loja do colaborador OU pela loja do registro
    if (!isRH && targetLojaId) {
      where.OR = [
        { colaborador: { lojaId: targetLojaId } },
        { lojaId: targetLojaId }
      ];
    }

    const result = await prisma.registroPonto.findMany({
      where,
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

    console.log(`[PONTO_TRATADOS] Data: ${data.toISOString()} | Encontrados: ${result.length} | isRH: ${isRH}`);
    return result;
  } catch (error) {
    console.error("[GET_INCONFORMIDADES_ERROR]:", error);
    return [];
  }
}

export async function getColaboradoresSemPontoNoDia(data: Date) {
  try {
    const session = await auth();
    if (!session?.user) return [];

    const isRH = ["RH", "ADMIN"].includes((session.user.role || "").toUpperCase());
    const targetLojaId = session.user.lojaId;

    const inicioDia = startOfDay(data);
    const fimDia = endOfDay(data);

    const whereRegistros: any = {
      data: { gte: inicioDia, lte: fimDia }
    };

    if (!isRH && targetLojaId) {
      whereRegistros.OR = [
        { colaborador: { lojaId: targetLojaId } },
        { lojaId: targetLojaId }
      ];
    }

    const registrosNoDia = await prisma.registroPonto.findMany({
      where: whereRegistros,
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
    
    const role = (session.user.role || "").toUpperCase();
    const isRH = role === "RH" || role === "ADMIN";
    const lojaId = session.user.lojaId;

    const where: any = {
      status: { in: ["ATIVO", "EM_EXPERIENCIA"] },
    };

    if (!isRH) {
      if (!lojaId) return 0;
      where.lojaId = lojaId;
    }
    
    return await prisma.colaborador.count({ where });
  } catch (error) {
    console.error("[GET_TOTAL_ATIVOS_ERROR]:", error);
    return 0;
  }
}
