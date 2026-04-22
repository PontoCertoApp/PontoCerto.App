import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  sendWelcomeEmail,
  sendPontoNotification,
  sendPenalidadeNotification,
  sendPremioNotification,
  sendPasswordResetEmail,
  sendGestorReport,
} from "@/lib/email/send";

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "app/api/email/test/route.ts não deve existir em produção. Remova este arquivo antes do deploy."
  );
}

const schema = z.object({
  template: z.enum([
    "welcome",
    "ponto",
    "penalidade",
    "premio",
    "password-reset",
    "gestor-report",
  ]),
  to: z.string().email().default("test@pontoce.rto"),
});

const fixtures = {
  welcome: {
    colaboradorNome: "Maria Silva Santos",
    cargo: "Vendedora Sênior",
    loja: "Loja Centro",
    dataAdmissao: "22/04/2026",
    loginUrl: "http://localhost:3000/login",
  },
  ponto: {
    colaboradorNome: "João Pereira",
    email: "joao@empresa.com",
    data: "22/04/2026",
    tipo: "FALTA_INJUSTIFICADA",
    justificativa: undefined,
    rapGerado: true,
  },
  penalidade: {
    colaboradorNome: "Carlos Oliveira",
    email: "carlos@empresa.com",
    tipo: "ADVERTENCIA",
    descricao:
      "Atraso recorrente nos últimos 30 dias sem justificativa prévia. Segunda advertência formal no período.",
    dataOcorrencia: "20/04/2026",
    validadeAte: "20/07/2026",
    status: "ATIVA",
  },
  premio: {
    colaboradorNome: "Ana Costa",
    email: "ana@empresa.com",
    tipoPremio: "Meta de Venda",
    valor: 850.0,
    mesReferencia: "Abril/2026",
    observacao: "Meta batida com 115% de aproveitamento.",
  },
  "password-reset": {
    colaboradorNome: "Lucas Ferreira",
    email: "lucas@empresa.com",
    resetUrl: "http://localhost:3000/reset-password?token=abc123",
    expiresIn: "2 horas",
  },
  "gestor-report": {
    gestorNome: "Fernanda Ramos",
    email: "fernanda@empresa.com",
    periodo: "Abril/2026",
    loja: "Loja Centro",
    totalColaboradores: 42,
    totalAtivos: 38,
    totalInconformidades: 7,
    totalPenalidades: 3,
    totalPremios: 12,
    valorTotalPremios: 9800.0,
    colaboradoresDestaque: [
      { nome: "Ana Costa", cargo: "Vendedora", premios: 3 },
      { nome: "Pedro Lima", cargo: "Caixa", premios: 2 },
      { nome: "Julia Martins", cargo: "Atendente", premios: 2 },
    ],
  },
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Endpoint disponível apenas em ambiente de desenvolvimento." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { template, to } = parsed.data;

  let result: { success: boolean; id?: string; error?: string };

  switch (template) {
    case "welcome":
      result = await sendWelcomeEmail(to, fixtures.welcome);
      break;
    case "ponto":
      result = await sendPontoNotification(to, fixtures.ponto);
      break;
    case "penalidade":
      result = await sendPenalidadeNotification(to, fixtures.penalidade);
      break;
    case "premio":
      result = await sendPremioNotification(to, fixtures.premio);
      break;
    case "password-reset":
      result = await sendPasswordResetEmail(to, fixtures["password-reset"]);
      break;
    case "gestor-report":
      result = await sendGestorReport(to, fixtures["gestor-report"]);
      break;
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    template,
    to,
    id: result.id,
    message: `Template "${template}" enviado para ${to}`,
  });
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  return NextResponse.json({
    endpoint: "POST /api/email/test",
    description: "Envia qualquer template de e-mail com dados de fixture",
    templates: [
      "welcome",
      "ponto",
      "penalidade",
      "premio",
      "password-reset",
      "gestor-report",
    ],
    example: {
      template: "welcome",
      to: "seu@email.com",
    },
  });
}
