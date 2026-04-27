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
    // A data vem como string YYYY-MM-DD do frontend agora
    const dataISO = typeof data.data === 'string' ? data.data.split('T')[0] : data.data.toISOString().split('T')[0];
    const dataPonto = new Date(`${dataISO}T12:00:00.000Z`); // Meio-dia UTC para evitar problemas de borda
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

      // SÓ gera RAP se for um tipo negativo e o usuário explicitamente marcou
      const tiposNegativos = ["FALTA_INJUSTIFICADA", "ATRASO", "SAIDA_ANTECIPADA", "PONTO_NAO_REGISTRADO"];
      const deveGerarRap = data.gerarRap && tiposNegativos.includes(data.tipo);

      if (deveGerarRap) {
        await tx.penalidade.create({
          data: {
            colaboradorId: finalColabId,
            tipo: PenalidadeTipo.INCONSISTENCIA_PONTO,
            descricao: `Penalidade gerada por inconformidade de ponto: ${data.tipo}. Data: ${dataPonto.toLocaleDateString()}`,
            dataOcorrencia: dataPonto,
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

    // Se não passar data, traz os últimos 100 de sempre
    const where: any = {};
    if (data) {
      const dataISO = typeof data === 'string' ? data.split('T')[0] : (data as any).toISOString().split('T')[0];
      const inicioDia = new Date(`${dataISO}T00:00:00.000Z`);
      const fimDia = new Date(`${dataISO}T23:59:59.999Z`);
      where.data = { gte: inicioDia, lte: fimDia };
    }

    return await prisma.registroPonto.findMany({
      where,
      include: {
        colaborador: {
          include: { loja: true, setor: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  } catch (error) {
    console.error("Erro ao buscar registros do dia:", error);
    return [];
  }
}

export async function getColaboradoresSemPontoNoDia(data: Date) {
  try {
    // A data vem como string YYYY-MM-DD
    const dataISO = typeof data === 'string' ? data.split('T')[0] : (data as any).toISOString().split('T')[0];
    const inicioDia = new Date(`${dataISO}T00:00:00.000Z`);
    const fimDia = new Date(`${dataISO}T23:59:59.999Z`);

    const registrosNoDia = await prisma.registroPonto.findMany({
      where: {
        data: { gte: inicioDia, lte: fimDia }
      },
      select: { colaboradorId: true },
    });

    const idsRegistrados = registrosNoDia.map((r) => r.colaboradorId);

    return await prisma.colaborador.findMany({
      where: {
        id: { notIn: idsRegistrados },
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

    const where: any = {};

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
export async function getLeaderboard() {
  try {
    const session = await auth();
    if (!session?.user) return [];

    // Busca todos os registros do mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const registros = await prisma.registroPonto.findMany({
      where: {
        data: { gte: inicioMes }
      },
      select: {
        colaboradorId: true,
        tipo: true,
        colaborador: {
          select: {
            nomeCompleto: true,
            loja: { select: { nome: true } }
          }
        }
      }
    });

    // Tabela de valores de pontos
    const PONTOS_MAP: Record<string, number> = {
      PONTO_POSITIVO: 10,
      META_BATIDA: 50,
      ELOGIO: 100,
      PRESENCA_MANUAL: 5,
      FALTA_INJUSTIFICADA: -50,
      ATRASO: -10,
      SAIDA_ANTECIPADA: -10,
      PONTO_NAO_REGISTRADO: -20
    };

    const leaderboardMap: Record<string, any> = {};

    registros.forEach(r => {
      const colabId = r.colaboradorId;
      if (!leaderboardMap[colabId]) {
        leaderboardMap[colabId] = {
          id: colabId,
          nome: r.colaborador.nomeCompleto,
          loja: r.colaborador.loja?.nome || "Geral",
          pontos: 0,
          vitorias: 0
        };
      }
      const pts = PONTOS_MAP[r.tipo || ""] || 0;
      leaderboardMap[colabId].pontos += pts;
      if (pts > 0) leaderboardMap[colabId].vitorias += 1;
    });

    return Object.values(leaderboardMap)
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 5); // Top 5
  } catch (error) {
    console.error("Erro no Leaderboard:", error);
    return [];
  }
}
