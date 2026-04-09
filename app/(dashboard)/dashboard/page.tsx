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
  FileCheck 
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as any;

  const stats = [
    {
      title: "Total de Colaboradores",
      value: "142",
      description: "+4 desde o último mês",
      icon: Users,
    },
    {
      title: "Pendências de Ponto",
      value: "12",
      description: "Ações necessárias hoje",
      icon: Clock,
      color: "text-amber-500",
    },
    {
      title: "RAPs Ativos",
      value: "3",
      description: "Pendentes de assinatura",
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: "Docs para Validar",
      value: "8",
      description: "Enviados pelo portal",
      icon: FileCheck,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao painel de controle do PontoCerto.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color || "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground italic">
              Gráfico de evolução de equipe (Em breve)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas 5 ações do RH
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {[1, 2, 3, 4, 5].map((i) => (
                 <div key={i} className="flex items-center gap-4">
                   <div className="h-2 w-2 rounded-full bg-primary" />
                   <div className="flex-1 space-y-1">
                     <p className="text-sm font-medium leading-none">
                       Documento validado: CPF - João Silva
                     </p>
                     <p className="text-xs text-muted-foreground">
                       Há {i * 10} minutos
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
