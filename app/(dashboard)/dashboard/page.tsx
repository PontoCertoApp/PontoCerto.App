import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";
import { formatDistanceToNow, format, subMonths, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DashboardPage() {
  try {
    const session = await auth();
    const userName = session?.user?.name || "Usuário";
    const role = session?.user?.role;
    const lojaId = session?.user?.lojaId;

    // Se for RH, não filtra por lojaId (vê tudo)
    // Se for GERENTE, filtra por lojaId
    const role = session?.user?.role?.toUpperCase();
    const isRH = role === "RH" || role === "ADMIN";
    const filter = isRH ? {} : (lojaId ? { lojaId } : { id: 'none' });

    // 1. Fetch Stats safely
    const [totalColaboradores, pendenciasPonto, rapsAtivos, documentosPendentes] = await Promise.all([
      prisma.colaborador.count({ where: filter }).catch(() => 0),
      prisma.registroPonto.count({ where: { ...filter, status: "PENDENTE" } }).catch(() => 0),
      prisma.penalidade.count({ where: { colaborador: filter, status: "ATIVA" } }).catch(() => 0),
      prisma.documento.count({ where: { colaborador: filter, status: "PENDENTE" } }).catch(() => 0),
    ]);

    // 2. Fetch Recent Activities safely
    const [recentDocs, recentColabs, recentPenalties] = await Promise.all([
      prisma.documento.findMany({
        where: { colaborador: filter },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { colaborador: true }
      }).catch(() => []),
      prisma.colaborador.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
        take: 5
      }).catch(() => []),
      prisma.penalidade.findMany({
        where: { colaborador: filter },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { colaborador: true }
      }).catch(() => [])
    ]);

    const activities = [
      ...(recentDocs || []).map(d => ({
        id: d.id,
        type: "DOC" as const,
        title: `Documento ${d.status === 'VALIDADO' ? 'validado' : 'recebido'}`,
        target: d.colaborador?.nomeCompleto || "N/A",
        time: d.createdAt ? formatDistanceToNow(new Date(d.createdAt), { addSuffix: true, locale: ptBR }) : "Agora",
        createdAt: d.createdAt ? new Date(d.createdAt) : new Date()
      })),
      ...(recentColabs || []).map(c => ({
        id: c.id,
        type: "CONTRATO" as const,
        title: "Admissão iniciada",
        target: c.nomeCompleto || "N/A",
        time: c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ptBR }) : "Agora",
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
      })),
      ...(recentPenalties || []).map(p => ({
        id: p.id,
        type: "PENALIDADE" as const,
        title: "RAP Gerado",
        target: p.colaborador?.nomeCompleto || "N/A",
        time: p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ptBR }) : "Agora",
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
      }))
    ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

    // 3. Fetch Chart Data (Last 6 months)
    const chartData = await Promise.all(
      Array.from({ length: 6 }).map(async (_, i) => {
        try {
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
        } catch {
          return { name: "-", total: 0 };
        }
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
  } catch (error) {
    console.error("Dashboard Critical Error:", error);
    // Fallback UI em caso de erro catastrófico
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h1 className="text-2xl font-bold">Ocorreu um erro ao carregar o Dashboard</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Não foi possível conectar ao banco de dados ou processar as informações no momento. 
          Por favor, recarregue a página.
        </p>
      </div>
    );
  }
}
