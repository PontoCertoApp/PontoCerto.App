"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Clock, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  TrendingUp,
  FileText,
  Award
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Controle de Ponto",
    description: "Registro preciso com geolocalização e reconhecimento facial para total segurança.",
    icon: Clock,
  },
  {
    title: "Gestão de Colaboradores",
    description: "Prontuário completo, documentos e histórico de cada membro da sua equipe.",
    icon: Users,
  },
  {
    title: "Relatórios Inteligentes",
    description: "Insights valiosos sobre produtividade, horas extras e custos operacionais.",
    icon: BarChart3,
  },
  {
    title: "Prêmios e Incentivos",
    description: "Sistema automatizado de bonificações para motivar quem entrega resultados.",
    icon: Award,
  },
];

const steps = [
  {
    number: "01",
    title: "Cadastre sua Empresa",
    description: "Crie sua conta em segundos e configure as unidades do seu negócio.",
  },
  {
    number: "02",
    title: "Importe sua Equipe",
    description: "Adicione seus colaboradores de forma simples ou sincronize com seu sistema.",
  },
  {
    number: "03",
    title: "Comece a Gerir",
    description: "Acompanhe batidas, valide documentos e gere relatórios em tempo real.",
  },
];

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="flex flex-col gap-24 py-12 md:py-24 overflow-hidden">
      {/* Hero Section */}
      <section className="container mx-auto px-4 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/20 blur-[120px] rounded-full -z-10" />
        
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Novo: Assinatura Digital de Documentos</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-bold tracking-tight text-gradient leading-[1.1]"
          >
            A nova era da gestão de <span className="text-primary-gradient">ponto e RH</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl px-4"
          >
            Simplifique sua operação, motive sua equipe e tenha controle total sobre a jornada de trabalho com a plataforma mais moderna do mercado.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto px-4"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="h-14 px-8 text-lg rounded-2xl w-full premium-shadow">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl w-full border-2">
                Entrar na Plataforma
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-16 relative w-full aspect-video max-w-5xl rounded-3xl overflow-hidden border border-border/50 glass-card premium-shadow"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5" />
             {/* Mock de interface/imagem */}
             <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                <TrendingUp className="h-24 w-24 text-primary/20" />
             </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Tudo o que você precisa</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma plataforma completa desenvolvida para resolver as dores reais do RH e gestores.
          </p>
        </div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-full glass-card hover:-translate-y-2 transition-all duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simples como deve ser</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Implementação rápida e intuitiva para que você foque no que realmente importa: as pessoas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
             {/* Line between steps */}
            <div className="hidden md:block absolute top-[2.5rem] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/5 via-primary/20 to-primary/5" />
            
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative z-10">
                <div className="h-20 w-20 rounded-full bg-background border-4 border-primary flex items-center justify-center text-2xl font-bold mb-6 premium-shadow">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Proof Section */}
      <section className="container mx-auto px-4 text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-y border-border/50">
           <div>
              <div className="text-4xl font-bold text-primary-gradient mb-1">+500</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Empresas</div>
           </div>
           <div>
              <div className="text-4xl font-bold text-primary-gradient mb-1">99.9%</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Uptime</div>
           </div>
           <div>
              <div className="text-4xl font-bold text-primary-gradient mb-1">24/7</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Suporte</div>
           </div>
           <div>
              <div className="text-4xl font-bold text-primary-gradient mb-1">+10k</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Usuários</div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 mb-24">
        <div className="relative rounded-[2.5rem] bg-primary overflow-hidden px-8 py-16 md:py-24 text-center text-primary-foreground">
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
           
           <div className="relative z-10 flex flex-col items-center gap-8 max-w-3xl mx-auto">
             <h2 className="text-3xl md:text-5xl font-bold leading-tight">Pronto para transformar a gestão da sua empresa?</h2>
             <p className="text-primary-foreground/80 text-lg md:text-xl">
               Junte-se a centenas de empresas que já modernizaram seu RH com o PontoCerto. 
               Teste grátis por 14 dias.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
               <Link href="/register" className="w-full sm:w-auto">
                 <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-2xl w-full font-bold shadow-xl">
                   Criar Minha Conta Grátis
                 </Button>
               </Link>
               <Link href="/login" className="w-full sm:w-auto">
                 <Button size="lg" variant="ghost" className="h-14 px-8 text-lg rounded-2xl w-full text-primary-foreground hover:bg-white/10">
                   Falar com especialista
                 </Button>
               </Link>
             </div>
           </div>
        </div>
      </section>
    </div>
  );
}
