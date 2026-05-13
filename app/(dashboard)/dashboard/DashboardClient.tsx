"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  FileCheck,
  TrendingUp,
  ArrowUpRight,
  UserPlus,
  FileText,
  ShieldAlert,
  Calendar,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  CloudSun,
  Activity
} from "lucide-react";
import Link from "next/link";
import { DashboardChart } from "@/components/dashboard-chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "DOC" | "CONTRATO" | "PENALIDADE";
  title: string;
  target: string;
  time: string;
}

const ACTIVITY_ICON_MAP = {
  DOC:        { Icon: FileText,   color: "bg-blue-500/20 text-blue-500" },
  CONTRATO:   { Icon: UserPlus,   color: "bg-emerald-500/20 text-emerald-500" },
  PENALIDADE: { Icon: ShieldAlert, color: "bg-destructive/20 text-destructive" },
} as const;

interface DashboardClientProps {
  userName: string;
  stats: {
    totalColaboradores: number;
    pendenciasPonto: number;
    rapsAtivos: number;
    documentosPendentes: number;
  };
  activities: ActivityItem[];
  chartData: { name: string; total: number }[];
}

export function DashboardClient({ userName, stats: dbStats, activities, chartData }: DashboardClientProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: "Bom dia", Icon: Sun, color: "text-amber-500" };
    if (hour < 18) return { text: "Boa tarde", Icon: CloudSun, color: "text-orange-500" };
    return { text: "Boa noite", Icon: Moon, color: "text-indigo-400" };
  };

  const greeting = getGreeting();

  const stats = [
    {
      title: "Colaboradores",
      value: dbStats.totalColaboradores.toString(),
      description: "Equipe total ativa",
      icon: Users,
      trend: "Real",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Pendências Ponto",
      value: dbStats.pendenciasPonto.toString(),
      description: "Ações necessárias",
      icon: Clock,
      trend: "Foco",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      title: "RAPs Ativos",
      value: dbStats.rapsAtivos.toString(),
      description: "Pendentes de assinatura",
      icon: AlertTriangle,
      trend: "Ação",
      color: "text-destructive",
      bg: "bg-destructive/10"
    },
    {
      title: "Documentos",
      value: dbStats.documentosPendentes.toString(),
      description: "Validar recebidos",
      icon: FileCheck,
      trend: "Fila",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-12"
      >
        {/* TOP BAR / GREETING */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <motion.div variants={item} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl", greeting.color)}>
                <greeting.Icon className="size-6" />
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest px-3">
                Live System Dashboard
              </Badge>
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-foreground uppercase">
                {greeting.text}, <span className="text-primary">{userName.split(' ')[0]}</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl font-medium opacity-70 italic">
                Sua central de comando estratégico para gestão de pessoas e resultados.
              </p>
            </div>
          </motion.div>
          
          <motion.div variants={item} className="flex items-center gap-4">
             <div className="glass-card p-6 rounded-[2rem] flex items-center gap-6 shadow-2xl border-primary/10">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-black text-primary tracking-[0.2em]">Data & Hora</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tighter">
                      {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs font-bold opacity-40">
                      {currentTime.toLocaleTimeString('pt-BR', { second: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(currentTime)}
                  </span>
                </div>
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/20">
                  <Clock className="size-8" />
                </div>
             </div>
          </motion.div>
        </div>

        {/* METRICS GRID */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <motion.div key={stat.title} variants={item} whileHover={{ y: -8, scale: 1.02 }} className="group">
              <Card className="glass-card overflow-hidden h-full relative border-none shadow-2xl group-hover:shadow-primary/10 transition-all duration-500">
                <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-10 -mr-8 -mt-8 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700", stat.bg)} />
                <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    {stat.title}
                  </span>
                  <div className={cn("p-3 rounded-2xl shadow-xl transition-all group-hover:rotate-12", stat.bg, stat.color)}>
                    <stat.icon size={24} strokeWidth={2.5} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-black tracking-tighter">{stat.value}</span>
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none px-3 py-1 font-black text-[10px] tracking-widest uppercase">
                      {stat.trend}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 font-bold uppercase tracking-tight opacity-60">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CENTER CONTENT: CHART & ACTIVITIES */}
        <div className="grid gap-8 lg:grid-cols-5">
          <motion.div variants={item} className="lg:col-span-3">
            <Card className="surface-card h-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-10 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-black tracking-tighter uppercase">Evolução de Equipe</CardTitle>
                  <CardDescription className="text-sm font-bold uppercase tracking-widest opacity-50">Crescimento mensal de colaboradores ativos</CardDescription>
                </div>
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <TrendingUp className="size-8" />
                </div>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                <DashboardChart data={chartData} />
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="surface-card h-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-10 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-black tracking-tighter uppercase">Atividades</CardTitle>
                  <CardDescription className="text-sm font-bold uppercase tracking-widest opacity-50">Fluxo operacional em tempo real</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <div className="size-2 bg-emerald-500 rounded-full animate-ping" />
                   <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest">
                    LIVE FEED
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <div className="space-y-6">
                  {activities.length > 0 ? (
                    activities.map((act) => {
                      const { Icon, color } = ACTIVITY_ICON_MAP[act.type];
                      return (
                      <motion.div
                        key={act.id}
                        className="flex items-center gap-5 group p-4 -mx-4 rounded-[1.5rem] hover:bg-muted/40 transition-all cursor-pointer"
                        whileHover={{ x: 8 }}
                      >
                        <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110", color)}>
                          <Icon className="h-7 w-7" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-black truncate leading-tight uppercase tracking-tight">
                            {act.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate font-bold uppercase opacity-60">
                            {act.type === "DOC" ? "Colaborador: " : "Alvo: "} 
                            <span className="text-foreground">{act.target}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                            {act.time}
                          </span>
                          <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                        </div>
                      </motion.div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30 gap-4">
                      <Activity className="size-12" />
                      <p className="text-sm font-black uppercase tracking-widest">Aguardando Movimentações...</p>
                    </div>
                  )}
                  <Link href="/relatorios" className="contents">
                    <Button className="w-full h-16 mt-4 rounded-2xl bg-muted/50 hover:bg-primary text-foreground hover:text-primary-foreground text-xs font-black uppercase tracking-[0.2em] transition-all group border-none shadow-none">
                      Ver Log Completo
                      <ArrowRight className="size-4 ml-2 transition-transform group-hover:translate-x-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* QUICK ACCESS ACTIONS */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { 
              title: "Tratamento de Ponto", 
              desc: `${dbStats.pendenciasPonto} colaboradores com assinaturas em aberto hoje.`, 
              cta: "Módulo Ponto", 
              color: "bg-primary text-primary-foreground",
              icon: Clock,
              href: "/ponto"
            },
            { 
              title: "Estoque Uniformes", 
              desc: "Controle centralizado de entrega, devolução e pedidos de fardamento.", 
              cta: "Gerenciar Kit", 
              color: "bg-slate-900 text-white dark:bg-white dark:text-black",
              icon: UserPlus,
              href: "/uniformes"
            },
            { 
              title: "Compliance Docs", 
              desc: `${dbStats.documentosPendentes} arquivos em espera para validação legal.`, 
              cta: "Auditar Agora", 
              color: "bg-indigo-600 text-white",
              icon: FileCheck,
              href: "/documentos"
            }
          ].map((feature, i) => (
            <motion.div 
              key={feature.title}
              variants={item}
              whileHover={{ y: -12, scale: 1.02 }}
              className={cn("p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group min-h-[280px] flex flex-col justify-between", feature.color)}
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-150 transition-transform duration-700">
                 <feature.icon className="size-32" />
              </div>
              <div className="relative z-10">
                <Badge className="bg-white/10 text-white border-none mb-4 uppercase font-black text-[9px] tracking-widest">Módulo Prioritário</Badge>
                <h3 className="text-3xl font-black tracking-tighter uppercase mb-3 leading-tight">{feature.title}</h3>
                <p className="opacity-80 font-bold text-sm leading-snug max-w-[80%]">{feature.desc}</p>
              </div>
              <Link 
                href={feature.href}
                className="w-full py-5 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all flex items-center justify-center gap-3 relative z-10"
              >
                {feature.cta}
                <ArrowUpRight className="size-5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
