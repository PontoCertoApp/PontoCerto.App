import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  sendBoasVindas,
  sendColaboradorCadastrado,
  sendPenalidadeAplicada,
  sendPremiosConcedido,
  sendDocumentoPendente,
  sendRelatorioSemanal,
} from "@/lib/email/send";
import { PenalidadeTipo } from "@/lib/enums";

const schema = z.object({
  template: z.enum([
    "boas-vindas",
    "colaborador",
    "penalidade",
    "premio",
    "documento",
    "relatorio",
  ]),
  to: z.string().email(),
});

const fixtures: any = {
  "boas-vindas": {
    nomeUsuario: "Maria Silva Santos",
    empresa: "PontoCerto Matriz",
    loginUrl: "http://localhost:3000/login",
  },
  colaborador: {
    rhNome: "RH Central",
    colaboradorNome: "João Pereira",
    cargo: "Vendedor",
    setor: "Comercial",
    dataAdmissao: "22/04/2026",
  },
  penalidade: {
    colaboradorNome: "Carlos Oliveira",
    tipoPenalidade: PenalidadeTipo.ADVERTENCIA,
    motivo: "Atraso recorrente nos últimos 30 dias.",
    dataOcorrencia: "20/04/2026",
    linkDocumento: "http://localhost:3000/dashboard",
  },
  premio: {
    colaboradorNome: "Ana Costa",
    nomePremio: "Destaque do Mês",
    valorOuDescricao: "R$ 500,00",
    mensagem: "Parabéns pelo excelente atendimento!",
  },
  documento: {
    colaboradorNome: "Lucas Ferreira",
    nomeDocumento: "Contrato de Trabalho",
    dataLimite: "25/04/2026",
    linkAssinatura: "http://localhost:3000/dashboard",
  },
  relatorio: {
    gestorNome: "Fernanda Ramos",
    unidade: "Loja Centro",
    periodo: "Abril/2026",
    totalColaboradores: 42,
    novasAdmissoes: 5,
    penalidadesNoPeriodo: 2,
    pendenciasDocumentais: 8,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const { template, to } = parsed;

    let result;
    switch (template) {
      case "boas-vindas":
        result = await sendBoasVindas(to, fixtures[template]);
        break;
      case "colaborador":
        result = await sendColaboradorCadastrado(to, fixtures[template]);
        break;
      case "penalidade":
        result = await sendPenalidadeAplicada(to, fixtures[template]);
        break;
      case "premio":
        result = await sendPremiosConcedido(to, fixtures[template]);
        break;
      case "documento":
        result = await sendDocumentoPendente(to, fixtures[template]);
        break;
      case "relatorio":
        result = await sendRelatorioSemanal(to, fixtures[template]);
        break;
    }

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/email/test",
    templates: Object.keys(fixtures),
  });
}
