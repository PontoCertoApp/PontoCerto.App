import { auth } from "@/auth";
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
  ShieldAlert
} from "lucide-react";
import { DashboardChart } from "@/components/dashboard-chart";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as any;

  const stats = [
    {
      title: "Total de Colaboradores",
      value: "142",
      description: "+4 desde o último mês",
      icon: Users,
      trend: "+2.5%"
    },
    {
      title: "Pendências de Ponto",
      value: "12",
      description: "Ações necessárias hoje",
      icon: Clock,
      color: "text-amber-500",
      trend: "-10%"
    },
    {
      title: "RAPs Ativos",
      value: "3",
      description: "Pendentes de assinatura",
      icon: AlertTriangle,
      color: "text-destructive",
      trend: "Estável"
    },
    {
      title: "Docs para Validar",
      value: "8",
      description: "Enviados pelo portal",
      icon: FileCheck,
      color: "text-blue-500",
      trend: "+12%"
    },
  ];

  const activities = [
    {
      id: 1,
      type: "DOC",
      title: "Documento validado: CPF",
      target: "João Silva",
      time: "Há 10 min",
      icon: FileText,
      iconColor: "text-blue-500"
    },
    {
      id: 2,
      type: "CONTRATO",
      title: "Nova Admissão iniciada",
      target: "Maria Souza",
      time: "Há 45 min",
      icon: UserPlus,
      iconColor: "text-green-500"
    },
    {
      id: 3,
      type: "PENALIDADE",
      title: "RAP Gerada automaticamente",
      target: "Carlos Lima",
      time: "Há 2 horas",
      icon: ShieldAlert,
      iconColor: "text-destructive"
    },
    {
      id: 4,
      type: "DOC",
      title: "Documento rejeitado: Comprovante",
      target: "Ana Oliveira",
      time: "Há 3 horas",
      icon: FileText,
      iconColor: "text-amber-500"
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            Olá, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Bem-vindo ao painel estratégico do <strong>PontoCerto RH</strong>.
          </p>
        </div>
        <Badge variant="outline" className="h-8 px-4 py-1 text-sm border-primary/20 bg-primary/5 text-primary">
          Competência: Outubro/2023
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={stat.title} className="overflow-hidden border-none shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all group">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-muted/50 ${stat.color || "text-primary"}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black">{stat.value}</div>
                <span className="text-xs font-medium text-green-500 flex items-center gap-0.5">
                   <TrendingUp className="h-3 w-3" /> {stat.trend}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Crescimento da Equipe</CardTitle>
              <CardDescription>Evolução de colaboradores ativos nos últimos 6 meses.</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4 lg:pl-2">
            <DashboardChart />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 border-none shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg">Feed de Atividades</CardTitle>
            <CardDescription>
              Últimas interações do sistema em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
               {activities.map((act) => (
                 <div key={act.id} className="flex gap-4 group">
                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-shadow group-hover:shadow-md`}>
                      <act.icon className={`h-5 w-5 ${act.iconColor}`} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                        {act.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Colaborador: <span className="font-medium text-foreground">{act.target}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-tighter mt-1">
                        {act.time}
                      </p>
                    </div>
                 </div>
               ))}
               <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary">
                 Ver histórico completo
               </Button>
             </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
         <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-base">Módulo de Ponto</CardTitle>
              <CardDescription className="text-primary-foreground/70">12 colaboradores com pendência de assinatura de PGF hoje.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">Tratar Agora <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
            </CardContent>
         </Card>
         <Card className="bg-black text-white border-none">
            <CardHeader>
              <CardTitle className="text-base">Alertas de Vencimento</CardTitle>
              <CardDescription className="text-zinc-400">5 uniformes atingem prazo de troca de 6 meses nesta semana.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-zinc-800 hover:bg-zinc-900 border-white/20">Ver Lista</Button>
            </CardContent>
         </Card>
         <Card className="bg-indigo-600 text-white border-none">
            <CardHeader>
              <CardTitle className="text-base">Contratações</CardTitle>
              <CardDescription className="text-indigo-100">3 novos colaboradores iniciam treinamento na segunda-feira.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-indigo-50">Gerenciar</Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

// Helper small Button component for Server Component
function Button({ children, className, variant = "default", size, asChild, ...props }: any) {
  const variants: any = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    link: "text-primary underline-offset-4 hover:underline",
  };
  
  const sizes: any = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8",
    icon: "h-10 w-10",
  };

  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size || "md"]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
