import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";
import { formatDistanceToNow, format, subMonths, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "Usuário";
  const role = session?.user?.role;
  const lojaId = session?.user?.lojaId;

  // Se for RH, não filtra por lojaId (vê tudo)
  // Se for GERENTE, filtra por lojaId
  const isRH = role === "RH";
  const filter = isRH ? {} : { lojaId };

  // 1. Fetch Stats
  const [totalColaboradores, pendenciasPonto, rapsAtivos, documentosPendentes] = await Promise.all([
    prisma.colaborador.count({ where: filter }),
    prisma.registroPonto.count({ where: { ...filter, status: "PENDENTE" } }),
    prisma.penalidade.count({ where: { colaborador: filter, status: "ATIVA" } }),
    prisma.documento.count({ where: { colaborador: filter, status: "PENDENTE" } }),
  ]);

  // 2. Fetch Recent Activities
  const [recentDocs, recentColabs, recentPenalties] = await Promise.all([
    prisma.documento.findMany({
      where: { colaborador: filter },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { colaborador: true }
    }),
    prisma.colaborador.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.penalidade.findMany({
      where: { colaborador: filter },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { colaborador: true }
    })
  ]);

  const activities = [
    ...recentDocs.map(d => ({
      id: d.id,
      type: "DOC" as const,
      title: `Documento ${d.status === 'VALIDADO' ? 'validado' : 'recebido'}`,
      target: d.colaborador?.nomeCompleto || "Colaborador Removido",
      time: formatDistanceToNow(new Date(d.createdAt), { addSuffix: true, locale: ptBR }),
      createdAt: new Date(d.createdAt)
    })),
    ...recentColabs.map(c => ({
      id: c.id,
      type: "CONTRATO" as const,
      title: "Admissão iniciada",
      target: c.nomeCompleto || "N/A",
      time: formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ptBR }),
      createdAt: new Date(c.createdAt)
    })),
    ...recentPenalties.map(p => ({
      id: p.id,
      type: "PENALIDADE" as const,
      title: "RAP Gerado",
      target: p.colaborador?.nomeCompleto || "Colaborador Removido",
      time: formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ptBR }),
      createdAt: new Date(p.createdAt)
    }))
  ]
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .slice(0, 5);

  // 3. Fetch Chart Data (Last 6 months)
  const chartData = await Promise.all(
    Array.from({ length: 6 }).map(async (_, i) => {
      const dateLimit = endOfMonth(subMonths(new Date(), 5 - i));
      const count = await prisma.colaborador.count({
        where: {
          ...filter,
          createdAt: { lte: dateLimit }
        }
      });
      return {
        name: format(dateLimit, "MMM", { locale: ptBR }),
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
