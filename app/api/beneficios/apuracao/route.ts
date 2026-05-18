import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Regras de desconto por ocorrência no período de apuração
// Falta → -R$100 pontualidade; 2 faltas → zera VA e pontualidade
// Atestado → -R$100 pontualidade
// Suspensão → zera VA e pontualidade
// Advertência geral → -R$20 pontualidade; açougue → -R$50
const DESCONTO_ADVERTENCIA_GERAL   = new Prisma.Decimal(20);
const DESCONTO_ADVERTENCIA_ACOUGUE = new Prisma.Decimal(50);
const DESCONTO_FALTA_PONT          = new Prisma.Decimal(100);
const DESCONTO_ATESTADO_PONT       = new Prisma.Decimal(100);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lojaId       = searchParams.get("lojaId")      || undefined;
  const competencia  = searchParams.get("competencia") || undefined; // YYYY-MM
  const statusFiltro = searchParams.get("status")      || undefined;

  let competenciaDate: Date | undefined;
  if (competencia) {
    const [ano, mes] = competencia.split("-").map(Number);
    competenciaDate = new Date(ano, mes - 1, 1);
  }

  const apuracoes = await prisma.apuracaoBeneficio.findMany({
    where: {
      ...(competenciaDate && { competencia: competenciaDate }),
      ...(statusFiltro && { statusApuracao: statusFiltro }),
      ...(lojaId && { colaborador: { lojaId } }),
    },
    include: {
      colaborador: {
        select: {
          nomeCompleto: true,
          funcao: { select: { nome: true, setor: { select: { nome: true } } } },
          loja: { select: { nome: true } },
        },
      },
    },
    orderBy: [{ competencia: "desc" }, { colaborador: { nomeCompleto: "asc" } }],
  });

  return NextResponse.json(apuracoes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF"].includes(role)) {
    return NextResponse.json({ error: "Apenas RH ou ADMIN pode apurar benefícios" }, { status: 403 });
  }

  const body = await req.json();
  const { competencia, lojaId } = body; // competencia: "YYYY-MM"

  if (!competencia) return NextResponse.json({ error: "Competência obrigatória" }, { status: 400 });

  const [ano, mes] = competencia.split("-").map(Number);
  const competenciaDate = new Date(ano, mes - 1, 1);
  const periodoInicio   = new Date(ano, mes - 2, 25); // dia 25 do mês anterior
  const periodoFim      = new Date(ano, mes - 1, 25); // dia 25 do mês atual

  const colaboradores = await prisma.colaborador.findMany({
    where: {
      status: { in: ["ATIVO", "EM_EXPERIENCIA"] },
      ...(lojaId && { lojaId }),
    },
    include: { funcao: { select: { valorValeAlimentacao: true, valorPontualidade: true, setor: { select: { nome: true } } } } },
  });

  const resultados = [];

  for (const colab of colaboradores) {
    // Verifica se já existe apuração para este colaborador nesta competência
    const existente = await prisma.apuracaoBeneficio.findFirst({
      where: { colaboradorId: colab.id, competencia: competenciaDate },
    });
    if (existente) {
      resultados.push({ colaboradorId: colab.id, status: "ja_existe" });
      continue;
    }

    const valeBase  = colab.funcao.valorValeAlimentacao ?? new Prisma.Decimal(0);
    const pontBase  = colab.funcao.valorPontualidade    ?? new Prisma.Decimal(0);
    const isAcougue = colab.funcao.setor.nome === "AÇOUGUE";

    // Busca penalidades do período
    const penalidades = await prisma.penalidade.findMany({
      where: {
        colaboradorId: colab.id,
        status: "ATIVA",
        dataOcorrencia: { gte: periodoInicio, lte: periodoFim },
      },
    });

    let descontosVale = new Prisma.Decimal(0);
    let descontosPont = new Prisma.Decimal(0);
    let zerouVale     = false;
    let zerouPont     = false;

    const faltas     = penalidades.filter((p) => p.tipo === "INCONSISTENCIA_PONTO" && p.descricao.toLowerCase().includes("falta")).length;
    const atestados  = penalidades.filter((p) => p.tipo === "INCONSISTENCIA_PONTO" && p.descricao.toLowerCase().includes("atestado")).length;
    const suspensoes = penalidades.filter((p) => p.tipo === "SUSPENSAO").length;
    const advertencias = penalidades.filter((p) => p.tipo === "ADVERTENCIA").length;

    // 2 faltas no mês → zera VA e pontualidade
    if (faltas >= 2) { zerouVale = true; zerouPont = true; }
    // 1 falta → -R$100 pontualidade (se não zerou)
    else if (faltas === 1) { descontosPont = descontosPont.add(DESCONTO_FALTA_PONT); }

    // Atestado → -R$100 pontualidade
    descontosPont = descontosPont.add(DESCONTO_ATESTADO_PONT.mul(atestados));

    // Suspensão → zera ambos
    if (suspensoes > 0) { zerouVale = true; zerouPont = true; }

    // Advertência → -R$20 (geral) ou -R$50 (açougue) na pontualidade
    const descontoAdv = isAcougue ? DESCONTO_ADVERTENCIA_ACOUGUE : DESCONTO_ADVERTENCIA_GERAL;
    descontosPont = descontosPont.add(descontoAdv.mul(advertencias));

    const valeFinal = zerouVale ? new Prisma.Decimal(0) : Prisma.Decimal.max(new Prisma.Decimal(0), valeBase.sub(descontosVale));
    const pontFinal = zerouPont ? new Prisma.Decimal(0) : Prisma.Decimal.max(new Prisma.Decimal(0), pontBase.sub(descontosPont));

    const apuracao = await prisma.apuracaoBeneficio.create({
      data: {
        colaboradorId: colab.id,
        competencia: competenciaDate,
        valorValeBase: valeBase,
        descontosVale,
        valorValeFinal: valeFinal,
        valorPontualidadeBase: pontBase,
        descontosPontualidade: descontosPont,
        valorPontualidadeFinal: pontFinal,
        zerouVale,
        zerouPontualidade: zerouPont,
        statusApuracao: "ABERTA",
      },
    });
    resultados.push({ colaboradorId: colab.id, apuracaoId: apuracao.id, status: "criada" });
  }

  return NextResponse.json({ competencia, total: resultados.length, resultados }, { status: 201 });
}
