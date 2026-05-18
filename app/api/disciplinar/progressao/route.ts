import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// Retorna o início do período atual de apuração (último dia 25 que passou)
function getPeriodoInicio(): Date {
  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();
  // Se hoje >= 25, o período começou no dia 25 do mês atual
  // Se hoje < 25, o período começou no dia 25 do mês anterior
  if (dia >= 25) {
    return new Date(ano, mes, 25, 0, 0, 0);
  } else {
    // mês anterior
    const mesAnterior = mes === 0 ? 11 : mes - 1;
    const anoAnterior = mes === 0 ? ano - 1 : ano;
    return new Date(anoAnterior, mesAnterior, 25, 0, 0, 0);
  }
}

// Calcula o próximo nível disciplinar dado os contadores atuais e a configuração
function calcProximoNivel(
  config: {
    inconsistenciasParaTermoConduta: number;
    inconsistenciasParaAdvertencia: number;
    termosCondutaMesmoMotivoParaAdvertencia: number;
    advertenciasParaSuspensao1dia: number;
    advertenciasParaSuspensao2dias: number;
    advertenciasParaSuspensao3dias: number;
    advertenciasParaSuspensao7dias: number;
  },
  tipo: string,
  contadorAtual: number
): string {
  if (tipo === "INCONSISTENCIA_PONTO") {
    if (contadorAtual + 1 >= config.inconsistenciasParaAdvertencia) return "ADVERTÊNCIA DIRETA";
    if (contadorAtual + 1 >= config.inconsistenciasParaTermoConduta) return "TERMO DE CONDUTA";
    return `Inconsistência ${contadorAtual + 1} — sem progressão ainda`;
  }
  if (tipo === "QUEDA_CONDUTA") {
    if (contadorAtual + 1 >= config.termosCondutaMesmoMotivoParaAdvertencia) return "ADVERTÊNCIA";
    return `Termo de Conduta ${contadorAtual + 1} — sem progressão ainda`;
  }
  if (tipo === "ADVERTENCIA") {
    if (contadorAtual + 1 >= config.advertenciasParaSuspensao7dias) return "JUSTA CAUSA";
    if (contadorAtual + 1 >= config.advertenciasParaSuspensao3dias) return "SUSPENSÃO 7 DIAS";
    if (contadorAtual + 1 >= config.advertenciasParaSuspensao2dias) return "SUSPENSÃO 3 DIAS";
    if (contadorAtual + 1 >= config.advertenciasParaSuspensao1dia)  return "SUSPENSÃO 2 DIAS";
    return `Advertência ${contadorAtual + 1} — próxima: SUSPENSÃO 1 DIA`;
  }
  if (tipo === "SUSPENSAO") {
    return "JUSTA CAUSA NA PRÓXIMA OCORRÊNCIA DESTE MOTIVO";
  }
  return "";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role as string;
  if (!["ADMIN", "HR_STAFF", "STORE_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { colaboradorId, tipo, motivoTexto, motivoPreCadastradoId, descricao, dataOcorrencia, diasSuspensao } = body;

  if (!colaboradorId || !tipo) {
    return NextResponse.json({ error: "colaboradorId e tipo são obrigatórios" }, { status: 400 });
  }

  // Validação de motivo obrigatório (mínimo 50 caracteres)
  const motivoFinal = motivoTexto?.trim() || "";
  if (motivoFinal.length < 50) {
    return NextResponse.json(
      { error: "Descreva o motivo detalhadamente antes de salvar. (mínimo 50 caracteres)" },
      { status: 422 }
    );
  }

  const config = await prisma.configuracaoProgressao.findFirst({ where: { ativa: true } });
  if (!config) return NextResponse.json({ error: "Configuração de progressão não encontrada" }, { status: 500 });

  const periodoInicio = getPeriodoInicio();

  // Conta penalidades do período atual por tipo e mesmo motivo pré-cadastrado
  const countAtual = await prisma.penalidade.count({
    where: {
      colaboradorId,
      tipo,
      status: "ATIVA",
      createdAt: { gte: periodoInicio },
      ...(motivoPreCadastradoId && { motivoPreCadastradoId }),
    },
  });

  const proximoNivel = calcProximoNivel(config, tipo, countAtual);

  // Calcula validade — suspensão cumpre prazo próprio; demais vencem no próximo reset (dia 25)
  const hoje = new Date();
  const proximoDia25 = hoje.getDate() < 25
    ? new Date(hoje.getFullYear(), hoje.getMonth(), 25)
    : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 25);

  let validadeAte = proximoDia25;
  if (tipo === "SUSPENSAO" && diasSuspensao) {
    const dt = new Date(dataOcorrencia || hoje);
    validadeAte = new Date(dt.getTime() + diasSuspensao * 24 * 60 * 60 * 1000);
  }

  const penalidade = await prisma.penalidade.create({
    data: {
      colaboradorId,
      tipo,
      descricao: descricao || motivoFinal.slice(0, 200),
      motivo: motivoFinal,
      motivoPreCadastradoId: motivoPreCadastradoId ?? null,
      dataOcorrencia: dataOcorrencia ? new Date(dataOcorrencia) : hoje,
      validadeAte,
      status: "ATIVA",
      geradoPorId: session.user.id!,
      diasSuspensao: tipo === "SUSPENSAO" ? diasSuspensao : null,
      contadorMotivo: countAtual + 1,
      proximoNivel,
    },
    include: {
      colaborador: { select: { nomeCompleto: true } },
      motivoPreCadastrado: true,
    },
  });

  return NextResponse.json({ penalidade, contadorAtual: countAtual + 1, proximoNivel }, { status: 201 });
}
