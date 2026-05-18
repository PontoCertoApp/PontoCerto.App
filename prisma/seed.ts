import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── HELPERS ────────────────────────────────────────────────────────────────

const d = (v: number | undefined) =>
  v !== undefined ? new Prisma.Decimal(v) : undefined;

// ─── SETORES ────────────────────────────────────────────────────────────────

const SETORES = [
  "CAIXA",
  "REPOSIÇÃO",
  "CONFERÊNCIA",
  "PADARIA - ATENDIMENTO",
  "PADARIA - PRODUÇÃO",
  "AÇOUGUE",
  "LIDERANÇA",
];

// ─── FUNÇÕES ─────────────────────────────────────────────────────────────────

interface FuncaoDef {
  nome: string;
  setor: string;
  exames: string[];
  prazoRenovacaoExame: number;
  valorValeAlimentacao?: number;
  valorPontualidade?: number;
  tipoPremio?: string;
  tempoTrocaUniforme: number; // meses
}

const FUNCOES: FuncaoDef[] = [
  // CAIXA
  { nome: "Frente de caixa",        setor: "CAIXA", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tempoTrocaUniforme: 12 },
  { nome: "Fiscal de caixa",        setor: "CAIXA", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tempoTrocaUniforme: 12 },
  { nome: "Operadora de Caixa",     setor: "CAIXA", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tempoTrocaUniforme: 12 },

  // REPOSIÇÃO
  { nome: "Repositor",                  setor: "REPOSIÇÃO", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tipoPremio: "campanha", tempoTrocaUniforme: 12 },
  { nome: "Repositor de Depósito",      setor: "REPOSIÇÃO", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tipoPremio: "campanha", tempoTrocaUniforme: 12 },
  { nome: "Repositor de Hortifruti",    setor: "REPOSIÇÃO", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tipoPremio: "campanha", tempoTrocaUniforme: 12 },
  { nome: "Repositor II",               setor: "REPOSIÇÃO", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tipoPremio: "campanha", tempoTrocaUniforme: 12 },
  { nome: "Aux de supermercados",       setor: "REPOSIÇÃO", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 300, valorPontualidade: 300, tempoTrocaUniforme: 12 },
  { nome: "Auxiliar geral (loja)",      setor: "REPOSIÇÃO", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 100, valorPontualidade: 100, tempoTrocaUniforme: 12 },
  { nome: "Auxiliar geral (limpeza)",   setor: "REPOSIÇÃO", exames: ["ASO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 6 },
  { nome: "Motorista",                  setor: "REPOSIÇÃO", exames: ["ASO", "TOXICOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 400, tempoTrocaUniforme: 12 },
  { nome: "Ajudante de Motorista",      setor: "REPOSIÇÃO", exames: ["ASO", "TOXICOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 800, tempoTrocaUniforme: 12 },
  { nome: "Motorista (roda as lojas)",  setor: "REPOSIÇÃO", exames: ["ASO", "TOXICOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 400, tempoTrocaUniforme: 12 },

  // CONFERÊNCIA
  { nome: "Conferente",                    setor: "CONFERÊNCIA", exames: ["ASO"], prazoRenovacaoExame: 12, tipoPremio: "campanha", tempoTrocaUniforme: 12 },
  { nome: "Conferente Jr.",                setor: "CONFERÊNCIA", exames: ["ASO"], prazoRenovacaoExame: 12, tipoPremio: "campanha", tempoTrocaUniforme: 12 },
  { nome: "Encarregado de Almoxerifado",   setor: "CONFERÊNCIA", exames: ["ASO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 12 },

  // PADARIA - ATENDIMENTO
  { nome: "Atendente geral", setor: "PADARIA - ATENDIMENTO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tempoTrocaUniforme: 6 },

  // PADARIA - PRODUÇÃO
  { nome: "Auxiliar de confeiteira",  setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 100, valorPontualidade: 100, tempoTrocaUniforme: 6 },
  { nome: "Auxiliar de cozinha",      setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 100, valorPontualidade: 100, tempoTrocaUniforme: 6 },
  { nome: "Auxiliar de Padeiro",      setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 100, valorPontualidade: 100, tempoTrocaUniforme: 6 },
  { nome: "Auxiliar de produção",     setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 6 },
  { nome: "Auxiliar geral (louças)",  setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 100, valorPontualidade: 100, tempoTrocaUniforme: 6 },
  { nome: "Confeiteira",              setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 100, valorPontualidade: 100, tipoPremio: "meta_venda", tempoTrocaUniforme: 6 },
  { nome: "Padeiro",                  setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 100, valorPontualidade: 100, tempoTrocaUniforme: 6 },
  { nome: "Salgadeira",               setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 100, valorPontualidade: 100, tipoPremio: "meta_venda", tempoTrocaUniforme: 6 },
  { nome: "Encarregado de Padaria",   setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 6 },
  { nome: "Encarregado de Produção",  setor: "PADARIA - PRODUÇÃO", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 6 },

  // AÇOUGUE
  { nome: "Açougueiro",             setor: "AÇOUGUE", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 300, valorPontualidade: 200, tipoPremio: "meta_perca", tempoTrocaUniforme: 6 },
  { nome: "Atendente de açougue",   setor: "AÇOUGUE", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 300, valorPontualidade: 200, tipoPremio: "meta_perca", tempoTrocaUniforme: 6 },
  { nome: "Atendente de açougue 1", setor: "AÇOUGUE", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 300, valorPontualidade: 200, tipoPremio: "meta_perca", tempoTrocaUniforme: 6 },
  { nome: "Auxiliar de Açougue",    setor: "AÇOUGUE", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 300, valorPontualidade: 200, tipoPremio: "meta_perca", tempoTrocaUniforme: 6 },
  { nome: "Auxiliar de pereciveis", setor: "AÇOUGUE", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 300, valorPontualidade: 200, tempoTrocaUniforme: 6 },
  { nome: "Desossador",             setor: "AÇOUGUE", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 300, valorPontualidade: 300, tipoPremio: "meta_perca", tempoTrocaUniforme: 6 },
  { nome: "Encarregado de Açougue", setor: "AÇOUGUE", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, tipoPremio: "meta_perca", tempoTrocaUniforme: 6 },
  { nome: "Líder de Açougue",       setor: "AÇOUGUE", exames: ["ASO", "HEMOGRAMA", "PARASITOLOGICO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 300, valorPontualidade: 300, tipoPremio: "meta_perca", tempoTrocaUniforme: 6 },

  // LIDERANÇA
  { nome: "Fiscal de prevenção",              setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tipoPremio: "campanha", tempoTrocaUniforme: 12 },
  { nome: "Líder de mercearia",               setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 12 },
  { nome: "Gerente de reposição",             setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 12 },
  { nome: "Gerente geral",                    setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 12 },
  { nome: "Prevenção",                        setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tipoPremio: "campanha", tempoTrocaUniforme: 12 },
  { nome: "Monitoramento",                    setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, tipoPremio: "reverso_cancelamentos", tempoTrocaUniforme: 12 },
  { nome: "Auxiliar de compras",              setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 12 },
  { nome: "Auxiliar de compras Senior",       setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 12 },
  { nome: "Auxiliar de escritório",           setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, tempoTrocaUniforme: 12 },
  { nome: "Fiscal de prevenção e perdas",     setor: "LIDERANÇA", exames: ["ASO"], prazoRenovacaoExame: 12, valorValeAlimentacao: 200, valorPontualidade: 200, tempoTrocaUniforme: 12 },
];

// ─── ITENS DE UNIFORME ───────────────────────────────────────────────────────

const ITENS = [
  { nome: "Camisa",               tipo: "UNIFORME" },
  { nome: "Camiseta",             tipo: "UNIFORME" },
  { nome: "Calça preta",          tipo: "UNIFORME" },
  { nome: "Calça branca",         tipo: "UNIFORME" },
  { nome: "Bota preta",           tipo: "EPI" },
  { nome: "Avental vermelho",     tipo: "EPI" },
  { nome: "Touca",                tipo: "EPI" },
  { nome: "Avental de plástico",  tipo: "EPI" },
  { nome: "Luva de aço",          tipo: "EPI" },
  { nome: "Luva descartável",     tipo: "EPI" },
];

// perfisMap: funcao_nome → [ {item_nome, quantidade, tempoTrocaMeses} ]
type PerfilItem = { item: string; quantidade: number; tempoTrocaMeses: number };

const PERFIS: Record<string, PerfilItem[]> = {
  // CAIXA
  "Frente de caixa":    [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Fiscal de caixa":    [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Operadora de Caixa": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }],

  // REPOSIÇÃO (uniforme = 2 camisetas + calça preta + bota EPI, limpeza = 6m)
  "Repositor":                 [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Repositor de Depósito":     [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Repositor de Hortifruti":   [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Repositor II":              [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Aux de supermercados":      [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Auxiliar geral (loja)":     [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Auxiliar geral (limpeza)":  [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6  }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 6  }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Motorista":                 [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Ajudante de Motorista":     [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Motorista (roda as lojas)": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],

  // CONFERÊNCIA
  "Conferente":                  [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Conferente Jr.":              [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Encarregado de Almoxerifado": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],

  // PADARIA - ATENDIMENTO
  "Atendente geral": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],

  // PADARIA - PRODUÇÃO (2 camisetas + 2 calças brancas + EPIs)
  "Auxiliar de confeiteira": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Auxiliar de cozinha":     [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Auxiliar de Padeiro":     [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Auxiliar de produção":    [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Auxiliar geral (louças)": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Confeiteira":             [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Padeiro":                 [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Salgadeira":              [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Encarregado de Padaria":  [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],
  "Encarregado de Produção": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental vermelho", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }],

  // AÇOUGUE — TODOS os 5 EPIs são obrigatórios
  "Açougueiro":             [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental de plástico", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva de aço", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva descartável", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }],
  "Atendente de açougue":   [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental de plástico", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva de aço", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva descartável", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }],
  "Atendente de açougue 1": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental de plástico", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva de aço", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva descartável", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }],
  "Auxiliar de Açougue":    [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental de plástico", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva de aço", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva descartável", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }],
  "Auxiliar de pereciveis": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental de plástico", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva de aço", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva descartável", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }],
  "Desossador":             [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental de plástico", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva de aço", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva descartável", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }],
  "Encarregado de Açougue": [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental de plástico", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva de aço", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva descartável", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }],
  "Líder de Açougue":       [{ item: "Camiseta", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Calça branca", quantidade: 2, tempoTrocaMeses: 6 }, { item: "Avental de plástico", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva de aço", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Luva descartável", quantidade: 1, tempoTrocaMeses: 6 }, { item: "Touca", quantidade: 1, tempoTrocaMeses: 6 }],

  // LIDERANÇA
  "Fiscal de prevenção":          [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Líder de mercearia":           [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Gerente de reposição":         [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Gerente geral":                [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Prevenção":                    [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Monitoramento":                [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Auxiliar de compras":          [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Auxiliar de compras Senior":   [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Auxiliar de escritório":       [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
  "Fiscal de prevenção e perdas": [{ item: "Camisa", quantidade: 2, tempoTrocaMeses: 12 }, { item: "Calça preta", quantidade: 1, tempoTrocaMeses: 12 }, { item: "Bota preta", quantidade: 1, tempoTrocaMeses: 12 }],
};

// ─── MOTIVOS PRÉ-CADASTRADOS ─────────────────────────────────────────────────

const MOTIVOS = [
  // INCONSISTÊNCIA DE PONTO
  { texto: "Atraso excedente de 10 minutos",   categoria: "INCONSISTENCIA_PONTO", ordem: 1 },
  { texto: "Falta de registro de ponto",        categoria: "INCONSISTENCIA_PONTO", ordem: 2 },
  { texto: "Não retornar após o intervalo",     categoria: "INCONSISTENCIA_PONTO", ordem: 3 },
  { texto: "Batida duplicada",                  categoria: "INCONSISTENCIA_PONTO", ordem: 4 },
  { texto: "Faltas justificadas",               categoria: "INCONSISTENCIA_PONTO", ordem: 5 },
  { texto: "Exceder 6h direto",                 categoria: "INCONSISTENCIA_PONTO", ordem: 6 },
  { texto: "Exceder 5h30",                      categoria: "INCONSISTENCIA_PONTO", ordem: 7 },
  { texto: "Exceder 2 horas extras",            categoria: "INCONSISTENCIA_PONTO", ordem: 8 },
  { texto: "Troca de folga",                    categoria: "INCONSISTENCIA_PONTO", ordem: 9 },

  // TERMO DE CONDUTA (AC)
  { texto: "Comprar em horário de trabalho",                          categoria: "TERMO_CONDUTA", ordem: 1 },
  { texto: "Conversas paralelas",                                     categoria: "TERMO_CONDUTA", ordem: 2 },
  { texto: "Brincadeiras",                                            categoria: "TERMO_CONDUTA", ordem: 3 },
  { texto: "Pequenos atritos e pequenas insubordinações",             categoria: "TERMO_CONDUTA", ordem: 4 },
  { texto: "Desorganização do setor",                                 categoria: "TERMO_CONDUTA", ordem: 5 },
  { texto: "Não usar os EPIs",                                        categoria: "TERMO_CONDUTA", ordem: 6 },
  { texto: "Uniforme incorreto",                                      categoria: "TERMO_CONDUTA", ordem: 7 },
  { texto: "Uso de telefone",                                         categoria: "TERMO_CONDUTA", ordem: 8 },
  { texto: "Não responder o Sults",                                   categoria: "TERMO_CONDUTA", ordem: 9 },
  { texto: "Quebra de procedimentos em geral da empresa",             categoria: "TERMO_CONDUTA", ordem: 10 },

  // ADVERTÊNCIA
  { texto: "A primeira advertência é verbal (exceto por falta)",              categoria: "ADVERTENCIA", ordem: 1 },
  { texto: "Segunda vez pelo mesmo motivo é por escrito",                     categoria: "ADVERTENCIA", ordem: 2 },
  { texto: "10 inconsistências por atraso excedente de 10 minutos",           categoria: "ADVERTENCIA", ordem: 3 },
  { texto: "5 inconsistências por atraso maior que 30 minutos",               categoria: "ADVERTENCIA", ordem: 4 },
  { texto: "10 inconsistências por erros de ponto",                           categoria: "ADVERTENCIA", ordem: 5 },
  { texto: "3 termos de conduta no mês",                                      categoria: "ADVERTENCIA", ordem: 6 },
  { texto: "5 vezes no mês com uniforme incorreto",                           categoria: "ADVERTENCIA", ordem: 7 },
  { texto: "Insubordinação grave (desacatar gerente ou líder)",               categoria: "ADVERTENCIA", ordem: 8 },
  { texto: "Quebra de procedimentos mais graves",                             categoria: "ADVERTENCIA", ordem: 9 },
  { texto: "Atos mais graves solicitados pelo supervisor ou diretor",          categoria: "ADVERTENCIA", ordem: 10 },
  { texto: "Solicitações de advertências por líderes, gerentes ou monitoramento", categoria: "ADVERTENCIA", ordem: 11 },
  { texto: "Faltas sem justificativas (gera advertência + suspensão)",        categoria: "ADVERTENCIA", ordem: 12 },

  // SUSPENSÃO
  { texto: "3ª Advertência pelo mesmo motivo → Suspensão de 1 dia",          categoria: "SUSPENSAO", ordem: 1 },
  { texto: "4ª Advertência pelo mesmo motivo → Suspensão de 2 dias",         categoria: "SUSPENSAO", ordem: 2 },
  { texto: "5ª Advertência pelo mesmo motivo → Suspensão de 3 dias",         categoria: "SUSPENSAO", ordem: 3 },
  { texto: "6ª Advertência pelo mesmo motivo → Suspensão de 7 dias",         categoria: "SUSPENSAO", ordem: 4 },
  { texto: "Após suspensão de 7 dias → próxima ocorrência = JUSTA CAUSA",    categoria: "SUSPENSAO", ordem: 5 },
];

// ─── TIPOS DE DOCUMENTO ──────────────────────────────────────────────────────

const TIPOS_DOCUMENTO = [
  // OPERACIONAL — cobrados diariamente ao gestor pelo RH
  { nome: "Holerites",                categoria: "OPERACIONAL", obrigatorio: true,  ordem: 1 },
  { nome: "Cartões de ponto",         categoria: "OPERACIONAL", obrigatorio: true,  ordem: 2 },
  { nome: "Termos de EPI",            categoria: "OPERACIONAL", obrigatorio: true,  ordem: 3 },
  { nome: "Inconsistências de ponto", categoria: "OPERACIONAL", obrigatorio: false, ordem: 4 },
  { nome: "Recibos de pagamento (para liberação)", categoria: "OPERACIONAL", obrigatorio: false, ordem: 5 },
  { nome: "Recibos de férias",        categoria: "OPERACIONAL", obrigatorio: false, ordem: 6 },
  { nome: "Contas bancárias (Banco do Brasil)", categoria: "OPERACIONAL", obrigatorio: true,  ordem: 7 },

  // DISCIPLINAR
  { nome: "Ajuste de Conduta",  categoria: "DISCIPLINAR", obrigatorio: false, ordem: 1 },
  { nome: "Advertências",       categoria: "DISCIPLINAR", obrigatorio: false, ordem: 2 },
  { nome: "Suspensão",          categoria: "DISCIPLINAR", obrigatorio: false, ordem: 3 },
  { nome: "Justa Causa",        categoria: "DISCIPLINAR", obrigatorio: false, ordem: 4 },
  { nome: "Termos rescisórios", categoria: "DISCIPLINAR", obrigatorio: false, ordem: 5 },

  // ADMISSIONAL — universais para todos os colaboradores
  { nome: "CPF",                              categoria: "ADMISSIONAL", obrigatorio: true,  ordem: 1 },
  { nome: "RG",                               categoria: "ADMISSIONAL", obrigatorio: true,  ordem: 2 },
  { nome: "Título eleitoral",                 categoria: "ADMISSIONAL", obrigatorio: true,  ordem: 3 },
  { nome: "Comprovante de endereço",          categoria: "ADMISSIONAL", obrigatorio: true,  ordem: 4 },
  { nome: "Certidão de casamento",            categoria: "ADMISSIONAL", obrigatorio: false, ordem: 5 },
  { nome: "Comprovante de reservista",        categoria: "ADMISSIONAL", obrigatorio: false, ordem: 6 },
  { nome: "Espelho do PIS",                   categoria: "ADMISSIONAL", obrigatorio: true,  ordem: 7 },
  { nome: "Histórico/certificado escolar",    categoria: "ADMISSIONAL", obrigatorio: true,  ordem: 8 },
  { nome: "CTPS digital",                     categoria: "ADMISSIONAL", obrigatorio: true,  ordem: 9 },
  { nome: "Certidão de nascimento dos filhos", categoria: "ADMISSIONAL", obrigatorio: false, ordem: 10 },
  { nome: "CPF dos filhos",                   categoria: "ADMISSIONAL", obrigatorio: false, ordem: 11 },
  { nome: "Cartão de vacina dos filhos",      categoria: "ADMISSIONAL", obrigatorio: false, ordem: 12 },

  // EXAMES
  { nome: "ASO",            categoria: "BENEFICIO", obrigatorio: true,  ordem: 1 },
  { nome: "Hemograma",      categoria: "BENEFICIO", obrigatorio: false, ordem: 2 },
  { nome: "Parasitológico", categoria: "BENEFICIO", obrigatorio: false, ordem: 3 },
  { nome: "Toxicológico",   categoria: "BENEFICIO", obrigatorio: false, ordem: 4 },
];

// ─── VAGAS LOJA SANTA HELENA ─────────────────────────────────────────────────
// funcaoNome → [quantidadeMaxima, quantidadeAtual]
const VAGAS_SANTA_HELENA: Array<[string, number, number]> = [
  ["Gerente geral",               1, 1],
  ["Gerente de reposição",        1, 1],
  ["Líder de Açougue",            1, 1],
  ["Fiscal de caixa",             3, 3],
  ["Operadora de Caixa",         14, 13], // 1 aberta
  ["Conferente",                  2, 2],
  ["Encarregado de Almoxerifado", 1, 1],
  ["Repositor",                   9, 9],
  ["Repositor de Hortifruti",     2, 2],
  ["Repositor de Depósito",       1, 1],
  ["Repositor II",                1, 1],  // repositor (cartaz)
  ["Motorista (roda as lojas)",   1, 1],
  ["Motorista",                   1, 1],
  ["Ajudante de Motorista",       1, 1],
  ["Auxiliar geral (limpeza)",    2, 2],
  ["Líder de mercearia",          1, 1],
  ["Encarregado de Padaria",      1, 1],
  ["Padeiro",                     3, 3],
  ["Auxiliar de produção",        1, 1],
  ["Auxiliar de cozinha",         1, 1],
  ["Confeiteira",                 3, 3],
  ["Auxiliar de confeiteira",     1, 1],
  ["Salgadeira",                  1, 1],
  ["Auxiliar geral (loja)",       2, 2],
  ["Auxiliar de Padeiro",         2, 2],
  ["Aux de supermercados",        2, 2],
  ["Açougueiro",                  3, 3],
  ["Desossador",                  1, 1],
  ["Atendente de açougue",        4, 4],
  ["Auxiliar de Açougue",         1, 1],
  ["Encarregado de Produção",     2, 2],  // assados
  ["Auxiliar de pereciveis",      1, 1],
  ["Prevenção",                   1, 1],
  // vagas em aberto inicialmente
  ["Repositor",                   4, 0],  // término de contrato
  ["Auxiliar geral (loja)",       2, 0],  // aux de serviços
];

// ─── SEED PRINCIPAL ──────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  RH Incentive Gestão — Seed Completo");
  console.log("═══════════════════════════════════════════════");

  // ── 1. SETORES ──────────────────────────────────────────────────────────────
  console.log("\n[1/9] Criando setores...");
  const setorMap: Record<string, string> = {};
  for (const nome of SETORES) {
    const s = await prisma.setor.upsert({
      where: { id: `setor-${nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}` },
      update: { nome },
      create: { id: `setor-${nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`, nome },
    });
    setorMap[nome] = s.id;
    console.log(`  ✓ ${nome}`);
  }

  // ── 2. FUNÇÕES ──────────────────────────────────────────────────────────────
  console.log("\n[2/9] Criando funções...");
  const funcaoMap: Record<string, string> = {};
  for (const f of FUNCOES) {
    const setorId = setorMap[f.setor];
    if (!setorId) {
      console.warn(`  ⚠ Setor '${f.setor}' não encontrado, pulando função '${f.nome}'`);
      continue;
    }
    const slug = `funcao-${f.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50)}`;
    const funcao = await prisma.funcao.upsert({
      where: { id: slug },
      update: {
        nome: f.nome,
        setorId,
        exames: f.exames,
        prazoRenovacaoExame: f.prazoRenovacaoExame,
        valorValeAlimentacao: d(f.valorValeAlimentacao),
        valorPontualidade: d(f.valorPontualidade),
        tipoPremio: f.tipoPremio ?? null,
        tempoTrocaUniforme: f.tempoTrocaUniforme,
        ativo: true,
      },
      create: {
        id: slug,
        nome: f.nome,
        setorId,
        salarioBase: 0,
        exames: f.exames,
        prazoRenovacaoExame: f.prazoRenovacaoExame,
        valorValeAlimentacao: d(f.valorValeAlimentacao),
        valorPontualidade: d(f.valorPontualidade),
        tipoPremio: f.tipoPremio ?? null,
        tempoTrocaUniforme: f.tempoTrocaUniforme,
        ativo: true,
      },
    });
    funcaoMap[f.nome] = funcao.id;
    console.log(`  ✓ ${f.nome} [${f.setor}]`);
  }

  // ── 3. ITENS DE UNIFORME ────────────────────────────────────────────────────
  console.log("\n[3/9] Criando itens de uniforme...");
  const itemMap: Record<string, string> = {};
  for (const item of ITENS) {
    const slug = `item-${item.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
    const created = await prisma.itemUniforme.upsert({
      where: { id: slug },
      update: { nome: item.nome, tipo: item.tipo },
      create: { id: slug, nome: item.nome, tipo: item.tipo, ativo: true },
    });
    itemMap[item.nome] = created.id;
    console.log(`  ✓ ${item.nome} [${item.tipo}]`);
  }

  // ── 4. PERFIS DE UNIFORME ───────────────────────────────────────────────────
  console.log("\n[4/9] Criando perfis de uniforme...");
  // Remove perfis existentes e recria (idempotente)
  const funcaoIds = Object.values(funcaoMap);
  if (funcaoIds.length > 0) {
    await prisma.perfilUniforme.deleteMany({ where: { funcaoId: { in: funcaoIds } } });
  }
  for (const [funcaoNome, itens] of Object.entries(PERFIS)) {
    const funcaoId = funcaoMap[funcaoNome];
    if (!funcaoId) continue;
    for (const pi of itens) {
      const itemId = itemMap[pi.item];
      if (!itemId) {
        console.warn(`  ⚠ Item '${pi.item}' não encontrado`);
        continue;
      }
      await prisma.perfilUniforme.create({ data: { funcaoId, itemId, quantidade: pi.quantidade, tempoTrocaMeses: pi.tempoTrocaMeses } });
    }
    console.log(`  ✓ Perfil: ${funcaoNome}`);
  }

  // ── 5. CONFIGURAÇÃO DE PROGRESSÃO DISCIPLINAR ───────────────────────────────
  console.log("\n[5/9] Criando configuração de progressão disciplinar...");
  const configExistente = await prisma.configuracaoProgressao.findFirst({ where: { ativa: true } });
  if (!configExistente) {
    await prisma.configuracaoProgressao.create({
      data: {
        inconsistenciasParaTermoConduta: 3,
        inconsistenciasParaAdvertencia: 5,
        termosCondutaMesmoMotivoParaAdvertencia: 4,
        advertenciasParaSuspensao1dia: 3,
        advertenciasParaSuspensao2dias: 4,
        advertenciasParaSuspensao3dias: 5,
        advertenciasParaSuspensao7dias: 6,
        ativa: true,
      },
    });
    console.log("  ✓ ConfiguracaoProgressao criada (valores reais da planilha)");
  } else {
    console.log("  ✓ ConfiguracaoProgressao já existe, mantida");
  }

  // ── 6. MOTIVOS PRÉ-CADASTRADOS ──────────────────────────────────────────────
  console.log("\n[6/9] Criando motivos pré-cadastrados...");
  for (const m of MOTIVOS) {
    const slug = `motivo-${m.categoria.toLowerCase()}-${m.ordem}`;
    await prisma.motivoPreCadastrado.upsert({
      where: { id: slug },
      update: { texto: m.texto, categoria: m.categoria, ordem: m.ordem, ativo: true },
      create: { id: slug, texto: m.texto, categoria: m.categoria, ordem: m.ordem, ativo: true },
    });
  }
  console.log(`  ✓ ${MOTIVOS.length} motivos criados`);

  // ── 7. TIPOS DE DOCUMENTO ───────────────────────────────────────────────────
  console.log("\n[7/9] Criando tipos de documento...");
  for (const td of TIPOS_DOCUMENTO) {
    const slug = `tipdoc-${td.categoria.toLowerCase()}-${td.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40)}`;
    await prisma.tipoDocumento.upsert({
      where: { id: slug },
      update: { nome: td.nome, categoria: td.categoria, obrigatorio: td.obrigatorio, ordem: td.ordem, ativo: true },
      create: { id: slug, nome: td.nome, categoria: td.categoria, obrigatorio: td.obrigatorio, ordem: td.ordem, ativo: true },
    });
  }
  console.log(`  ✓ ${TIPOS_DOCUMENTO.length} tipos de documento criados`);

  // ── 8. LOJA SANTA HELENA + VAGAS ────────────────────────────────────────────
  console.log("\n[8/9] Criando Loja Santa Helena e vagas...");
  const santaHelena = await prisma.loja.upsert({
    where: { id: "loja-santa-helena" },
    update: { nome: "Loja Santa Helena", cidade: "Santa Helena", ativo: true },
    create: { id: "loja-santa-helena", nome: "Loja Santa Helena", cidade: "Santa Helena", ativo: true },
  });

  // Remove vagas existentes da Santa Helena e recria
  await prisma.vaga.deleteMany({ where: { lojaId: santaHelena.id } });

  let vagasCriadas = 0;
  for (const [funcaoNome, qtdMax, qtdAtual] of VAGAS_SANTA_HELENA) {
    const funcaoId = funcaoMap[funcaoNome];
    if (!funcaoId) {
      console.warn(`  ⚠ Função '${funcaoNome}' não encontrada para vaga`);
      continue;
    }
    const status = qtdAtual >= qtdMax ? "PREENCHIDA" : "ABERTA";
    await prisma.vaga.create({
      data: { funcaoId, lojaId: santaHelena.id, quantidadeMaxima: qtdMax, quantidadeAtual: qtdAtual, status },
    });
    vagasCriadas++;
  }
  console.log(`  ✓ ${vagasCriadas} vagas criadas para Loja Santa Helena`);

  // ── 9. USUÁRIOS DE TESTE ────────────────────────────────────────────────────
  console.log("\n[9/9] Criando usuários de teste...");
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const testEmails = ["admin@teste.com", "gerente@teste.com", "rh@teste.com", "colaborador@teste.com", "upload@teste.com"];
  const testCpfs   = ["11111111111", "22222222222", "33333333333", "44444444444", "55555555555"];

  const existingColabs = await prisma.colaborador.findMany({
    where: { OR: [{ email: { in: testEmails } }, { cpf: { in: testCpfs } }] },
    select: { id: true },
  });
  const colabIds = existingColabs.map((c) => c.id);

  await prisma.$transaction(async (tx) => {
    if (colabIds.length > 0) {
      await tx.penalidade.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.registroPonto.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.documento.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.premio.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.controleUniforme.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.entregaUniforme.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.exameColaborador.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.apuracaoBeneficio.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.bancoHoras.deleteMany({ where: { colaboradorId: { in: colabIds } } });
      await tx.historicoCargo.deleteMany({ where: { colaboradorId: { in: colabIds } } });
    }
    await tx.user.deleteMany({ where: { email: { in: testEmails } } });
    await tx.colaborador.deleteMany({
      where: { OR: [{ email: { in: testEmails } }, { cpf: { in: testCpfs } }] },
    });

    // Usar Loja Santa Helena para os usuários de teste
    const loja = santaHelena;

    let setor = await tx.setor.findFirst({ where: { nome: "CAIXA" } });
    if (!setor) setor = await tx.setor.findFirst();
    if (!setor) setor = await tx.setor.create({ data: { nome: "Geral" } });

    let funcao = await tx.funcao.findFirst({ where: { setorId: setor.id } });
    if (!funcao) funcao = await tx.funcao.create({ data: { nome: "Colaborador", setorId: setor.id, salarioBase: 1500 } });

    const testUsers = [
      { name: "Admin Teste",         email: "admin@teste.com",       role: "ADMIN",           cpf: "11111111111" },
      { name: "Gerente Teste",       email: "gerente@teste.com",     role: "STORE_MANAGER",   cpf: "22222222222" },
      { name: "RH Teste",            email: "rh@teste.com",          role: "HR_STAFF",        cpf: "33333333333" },
      { name: "Colaborador Teste",   email: "colaborador@teste.com", role: "EMPLOYEE",        cpf: "44444444444" },
      { name: "Operador Upload",     email: "upload@teste.com",      role: "UPLOAD_OPERATOR", cpf: "55555555555" },
    ];

    for (const u of testUsers) {
      const colab = await tx.colaborador.create({
        data: {
          nomeCompleto: u.name, cpf: u.cpf, rg: "000000000",
          dataNascimento: new Date("1990-01-01"), email: u.email,
          telefonePrincipal: "11999999999", contaBancoBrasil: "0000-0",
          lojaId: loja.id, setorId: setor.id, funcaoId: funcao.id, status: "ATIVO",
        },
      });
      await tx.user.create({
        data: { name: u.name, email: u.email, password: hashedPassword, role: u.role, lojaId: loja.id, colaboradorId: colab.id },
      });
      console.log(`  ✓ ${u.role.padEnd(16)} → ${u.email}`);
    }
  });

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Seed concluído com sucesso!");
  console.log("  Senha de todos os usuários de teste: admin123");
  console.log("═══════════════════════════════════════════════");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
