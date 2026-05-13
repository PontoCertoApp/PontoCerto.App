"use client";

import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  FolderKanban, 
  Briefcase, 
  ChevronRight,
  Settings2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ConfigMasterPage() {
  const configModules = [
    {
      title: "Lojas & Unidades",
      desc: "Gestão geográfica e administrativa de todas as sedes.",
      icon: Building2,
      href: "/config/lojas",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      stats: "Gerencie Sedes"
    },
    {
      title: "Setores & Departamentos",
      desc: "Organização da hierarquia estrutural da empresa.",
      icon: FolderKanban,
      href: "/config/setores",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      stats: "Defina Hierarquia"
    },
    {
      title: "Times & Equipes",
      desc: "Agrupamento operacional de colaboradores por unidade.",
      icon: Users,
      href: "/config/times",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      stats: "Gestão de Equipes"
    },
    {
      title: "Cargos & Funções",
      desc: "Definição de atribuições e remuneração base.",
      icon: Briefcase,
      href: "/config/funcoes",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      stats: "Estrutura Salarial"
    }
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
    <div className="p-8 space-y-12 max-w-[1200px] mx-auto min-h-screen relative overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-xl">
             <Settings2 className="h-7 w-7 text-primary" />
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest px-4 py-1">
            System Infrastructure
          </Badge>
        </div>
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-foreground">
            Funções <span className="text-primary">&</span> Lojas
          </h1>
          <p className="text-muted-foreground text-lg font-medium italic opacity-70">
            Configure a espinha dorsal da sua operação administrativa.
          </p>
        </div>
      </motion.div>

      {/* MODULES GRID */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2"
      >
        {configModules.map((mod) => (
          <motion.div key={mod.title} variants={item}>
            <Link href={mod.href} className="group block h-full">
              <Card className="glass-card h-full border-none shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-primary/10 relative overflow-hidden rounded-[2.5rem]">
                <div className={`absolute top-0 right-0 w-40 h-40 ${mod.bg} -mr-16 -mt-16 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700`} />
                
                <CardHeader className="flex flex-row items-start justify-between p-8 pb-4 relative z-10">
                  <div className={`p-5 rounded-[1.5rem] shadow-xl transition-all group-hover:rotate-12 ${mod.bg} ${mod.color}`}>
                    <mod.icon className="size-8" strokeWidth={2.5} />
                  </div>
                  <div className="p-3 bg-muted/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 shadow-inner">
                    <ArrowRight className="size-5 text-primary" />
                  </div>
                </CardHeader>

                <CardContent className="p-8 pt-4 relative z-10">
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/10 mb-2">
                       {mod.stats}
                    </Badge>
                    <h3 className="text-2xl font-black tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                  
                  <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-0 group-hover:opacity-100 transition-all">
                    <span>Acessar Módulo</span>
                    <Sparkles className="size-3 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* FOOTER INFO */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="pt-8"
      >
        <Card className="surface-card border-none shadow-2xl rounded-[3rem] overflow-hidden p-10 bg-gradient-to-br from-primary/5 to-transparent border-t-4 border-t-primary/20">
           <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-20 w-20 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 shrink-0">
                 <ShieldCheck className="size-10 text-white" />
              </div>
              <div className="space-y-2 text-center md:text-left">
                 <h4 className="text-xl font-black tracking-tighter uppercase leading-none">Controle de Integridade Estrutural</h4>
                 <p className="text-sm font-bold text-muted-foreground opacity-80 leading-relaxed max-w-2xl">
                   As configurações realizadas nestes módulos impactam diretamente no registro de pontos, na alocação de uniformes e na geração de relatórios de conformidade (RAP). Mantenha a estrutura atualizada para garantir a precisão dos dados.
                 </p>
              </div>
              <div className="flex-1 flex justify-end w-full">
                 <div className="p-4 bg-muted/40 rounded-2xl border border-primary/5 flex items-center gap-3">
                    <LayoutGrid className="size-5 text-primary opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Estrutura Ativa</span>
                 </div>
              </div>
           </div>
        </Card>
      </motion.div>
    </div>
  );
}
