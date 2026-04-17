export const ColaboradorStatus = {
  ATIVO: "ATIVO",
  INATIVO: "INATIVO",
  DESLIGADO: "DESLIGADO",
  EM_EXPERIENCIA: "EM_EXPERIENCIA",
} as const;
export type ColaboradorStatus = (typeof ColaboradorStatus)[keyof typeof ColaboradorStatus];

export const DocumentStatus = {
  PENDENTE: "PENDENTE",
  ENVIADO: "ENVIADO",
  VALIDADO: "VALIDADO",
  REJEITADO: "REJEITADO",
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const PenalidadeStatus = {
  ATIVA: "ATIVA",
  VENCIDA: "VENCIDA",
  CANCELADA: "CANCELADA",
} as const;
export type PenalidadeStatus = (typeof PenalidadeStatus)[keyof typeof PenalidadeStatus];

export const PenalidadeTipo = {
  INCONSISTENCIA_PONTO: "INCONSISTENCIA_PONTO",
  QUEDA_CONDUTA: "QUEDA_CONDUTA",
  ADVERTENCIA: "ADVERTENCIA",
  SUSPENSAO: "SUSPENSAO",
} as const;
export type PenalidadeTipo = (typeof PenalidadeTipo)[keyof typeof PenalidadeTipo];

export const PremioStatus = {
  ATIVO: "ATIVO",
  PAGO: "PAGO",
  CANCELADO: "CANCELADO",
} as const;
export type PremioStatus = (typeof PremioStatus)[keyof typeof PremioStatus];

export const PontoStatus = {
  PENDENTE: "PENDENTE",
  VALIDADO: "VALIDADO",
  INCONSISTENTE: "INCONSISTENTE",
} as const;
export type PontoStatus = (typeof PontoStatus)[keyof typeof PontoStatus];

export const PontoInconformidade = {
  FALTA_INJUSTIFICADA: "FALTA_INJUSTIFICADA",
  ATRASO: "ATRASO",
  SAIDA_ANTECIPADA: "SAIDA_ANTECIPADA",
  PONTO_NAO_REGISTRADO: "PONTO_NAO_REGISTRADO",
} as const;
export type PontoInconformidade = (typeof PontoInconformidade)[keyof typeof PontoInconformidade];
