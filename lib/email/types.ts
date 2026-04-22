export interface WelcomeEmailProps {
  colaboradorNome: string;
  cargo: string;
  loja: string;
  dataAdmissao: string;
  loginUrl: string;
}

export interface PontoNotificationProps {
  colaboradorNome: string;
  email: string;
  data: string;
  tipo: string;
  justificativa?: string;
  rapGerado: boolean;
}

export interface PenalidadeNotificationProps {
  colaboradorNome: string;
  email: string;
  tipo: string;
  descricao: string;
  dataOcorrencia: string;
  validadeAte: string;
  status: string;
}

export interface PremioNotificationProps {
  colaboradorNome: string;
  email: string;
  tipoPremio: string;
  valor: number;
  mesReferencia: string;
  observacao?: string;
}

export interface PasswordResetProps {
  colaboradorNome: string;
  email: string;
  resetUrl: string;
  expiresIn: string;
}

export interface GestorReportProps {
  gestorNome: string;
  email: string;
  periodo: string;
  loja: string;
  totalColaboradores: number;
  totalAtivos: number;
  totalInconformidades: number;
  totalPenalidades: number;
  totalPremios: number;
  valorTotalPremios: number;
  colaboradoresDestaque: Array<{
    nome: string;
    cargo: string;
    premios: number;
  }>;
}

export interface EmailSendResult {
  success: boolean;
  id?: string;
  error?: string;
}
