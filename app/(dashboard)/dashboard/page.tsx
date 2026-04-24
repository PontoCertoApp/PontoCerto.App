import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";
import { formatDistanceToNow, format, subMonths, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "Usuário";
  const lojaId = session?.user?.lojaId;

  if (!lojaId) {
    return <DashboardClient 
      userName={userName} 
      stats={{ totalColaboradores: 0, pendenciasPonto: 0, rapsAtivos: 0, documentosPendentes: 0 }} 
      activities={[]} 
      chartData={[]}
    />;
  }

  // 1. Fetch Stats
  const [totalColaboradores, pendenciasPonto, rapsAtivos, documentosPendentes] = await Promise.all([
    prisma.colaborador.count({ where: { lojaId } }),
    prisma.registroPonto.count({ where: { lojaId, status: "PENDENTE" } }),
    prisma.penalidade.count({ where: { colaborador: { lojaId }, status: "ATIVA" } }),
    prisma.documento.count({ where: { colaborador: { lojaId }, status: "PENDENTE" } }),
  ]);

  // 2. Fetch Recent Activities
  const [recentDocs, recentColabs, recentPenalties] = await Promise.all([
    prisma.documento.findMany({
      where: { colaborador: { lojaId } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { colaborador: true }
    }),
    prisma.colaborador.findMany({
      where: { lojaId },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),
    prisma.penalidade.findMany({
      where: { colaborador: { lojaId } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { colaborador: true }
    })
  ]);

  const activities = [
    ...recentDocs.map(d => ({
      id: d.id,
      type: "DOC" as const,
      title: `Documento ${d.status === 'VALIDADO' ? 'validado' : 'recebido'}`,
      target: d.colaborador.nomeCompleto,
      time: formatDistanceToNow(new Date(d.createdAt), { addSuffix: true, locale: ptBR }),
    })),
    ...recentColabs.map(c => ({
      id: c.id,
      type: "CONTRATO" as const,
      title: "Admissão iniciada",
      target: c.nomeCompleto,
      time: formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ptBR }),
    })),
    ...recentPenalties.map(p => ({
      id: p.id,
      type: "PENALIDADE" as const,
      title: "RAP Gerado",
      target: p.colaborador.nomeCompleto,
      time: formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ptBR }),
    }))
  ].slice(0, 5);

  // 3. Fetch Chart Data (Last 6 months)
  const chartData = await Promise.all(
    Array.from({ length: 6 }).map(async (_, i) => {
      const date = endOfMonth(subMonths(new Date(), 5 - i));
      const count = await prisma.colaborador.count({
        where: {
          lojaId,
          createdAt: { lte: date }
        }
      });
      return {
        name: format(date, "MMM", { locale: ptBR }),
        total: count
      };
    })
  );

  return (
    <DashboardClient 
      userName={userName} 
      stats={{ 
        totalColaboradores, 
        pendenciasPonto, 
        rapsAtivos, 
        documentosPendentes 
      }} 
      activities={activities}
      chartData={chartData}
    />
  );
}
