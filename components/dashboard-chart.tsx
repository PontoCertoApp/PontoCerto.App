"use client";

import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from "recharts";

interface DashboardChartProps {
  data?: { name: string; total: number }[];
}

export function DashboardChart({ data = [] }: DashboardChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
        Aguardando dados reais...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--background))", 
            borderColor: "hsl(var(--border))",
            borderRadius: "12px",
            fontSize: "12px"
          }} 
          itemStyle={{ color: "hsl(var(--primary))" }}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
        />
        <Bar
          dataKey="total"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
