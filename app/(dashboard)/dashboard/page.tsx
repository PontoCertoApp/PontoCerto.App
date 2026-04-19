"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
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
  ArrowRight
} from "lucide-react";
import { DashboardChart } from "@/components/dashboard-chart";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const stats = [
    {
      title: "Colaboradores",
      value: "142",
      description: "+4 desde o último mês",
      icon: Users,
      trend: "+2.5%",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Pendências Ponto",
      value: "12",
      description: "Ações necessárias hoje",
      icon: Clock,
      trend: "-10%",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      title: "RAPs Ativos",
      value: "3",
      description: "Pendentes de assinatura",
      icon: AlertTriangle,
      trend: "Estável",
      color: "text-destructive",
      bg: "bg-destructive/10"
    },
    {
      title: "Documentos",
      value: "8",
      description: "Validar recebidos",
      icon: FileCheck,
      trend: "+12%",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
  ];

  const activities = [
    {
      id: 1,
      type: "DOC",
      title: "Documento validado",
      target: "João Silva",
      time: "Há 10 min",
      icon: FileText,
      color: "bg-blue-500/20 text-blue-500"
    },
    {
      id: 2,
      type: "CONTRATO",
      title: "Admissão iniciada",
      target: "Maria Souza",
      time: "Há 45 min",
      icon: UserPlus,
      color: "bg-emerald-500/20 text-emerald-500"
    },
    {
      id: 3,
      type: "PENALIDADE",
      title: "RAP Gerado",
      target: "Carlos Lima",
      time: "Há 2 horas",
      icon: ShieldAlert,
      color: "bg-destructive/20 text-destructive"
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
    <div className="relative min-h-screen pb-20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div variants={item} className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
              <Sparkles className="size-4 animate-pulse" />
              <span>Painel de Controle</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-gradient">
              Olá, {user?.name?.split(' ')[0] || "Usuário"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Aqui está o resumo estratégico do seu <strong className="text-foreground">PontoCerto RH</strong> hoje.
            </p>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="glass-card flex items-center gap-3 p-2 pl-4 pr-1 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Competência</span>
                <span className="text-sm font-bold">Outubro / 2023</span>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Calendar className="size-5" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <motion.div key={stat.title} variants={item} whileHover={{ y: -5 }} className="group">
              <Card className="glass-card overflow-hidden h-full relative border-none premium-shadow">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} -mr-8 -mt-8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                    {stat.title}
                  </span>
                  <div className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:rotate-12`}>
                    <stat.icon size={20} strokeWidth={2.5} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">{stat.value}</span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none px-2 py-0">
                      {stat.trend}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Chart Section */}
          <motion.div variants={item} className="lg:col-span-3">
            <Card className="surface-card h-full border-none premium-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-8">
                <div>
                  <CardTitle className="text-2xl font-black">Crescimento Equipe</CardTitle>
                  <CardDescription className="text-base font-medium">Evolução de colaboradores ativos.</CardDescription>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-muted/50 text-primary">
                  <TrendingUp className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <DashboardChart />
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Feed Section */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="surface-card h-full border-none premium-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-8">
                <div>
                  <CardTitle className="text-2xl font-black">Atividades</CardTitle>
                  <CardDescription className="text-base font-medium">Fluxo em tempo real.</CardDescription>
                </div>
                <Badge variant="outline" className="animate-pulse bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
                  AO VIVO
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {activities.map((act) => (
                    <motion.div 
                      key={act.id} 
                      className="flex items-center gap-4 group p-3 -mx-3 rounded-2xl hover:bg-muted/30 transition-all"
                      whileHover={{ x: 5 }}
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${act.color} shadow-sm transition-transform group-hover:scale-110`}>
                        <act.icon className="h-6 w-6" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate leading-none">
                          {act.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Colaborador: <span className="font-bold text-foreground/80">{act.target}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase text-muted-foreground/40 whitespace-nowrap">
                        {act.time}
                      </span>
                    </motion.div>
                  ))}
                  <button className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-2xl bg-muted/50 hover:bg-primary hover:text-primary-foreground text-sm font-bold transition-all group">
                    Histórico Completo
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Feature Highlights */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { 
              title: "Módulo Ponto", 
              desc: "12 colaboradores com pendência de assinatura.", 
              cta: "Tratar Agora", 
              color: "bg-primary text-primary-foreground" 
            },
            { 
              title: "Uniformes", 
              desc: "5 trocas agendadas para os próximos 7 dias.", 
              cta: "Ver Lista", 
              color: "bg-slate-900 text-white dark:bg-white dark:text-black" 
            },
            { 
              title: "Contratações", 
              desc: "3 novos talentos ingressando na próxima segunda.", 
              cta: "Gerenciar", 
              color: "bg-indigo-600 text-white" 
            }
          ].map((feature, i) => (
            <motion.div 
              key={feature.title}
              variants={item}
              whileHover={{ y: -8 }}
              className={`p-8 rounded-[2rem] ${feature.color} flex flex-col justify-between h-[220px] shadow-2xl relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-500">
                 <Sparkles className="size-20" />
              </div>
              <div>
                <CardTitle className="text-xl font-black mb-2">{feature.title}</CardTitle>
                <p className="opacity-80 font-medium leading-tight">{feature.desc}</p>
              </div>
              <button className={`w-full py-4 px-6 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all flex items-center justify-center gap-2`}>
                {feature.cta}
                <ArrowUpRight className="size-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

