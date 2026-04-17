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

const data = [
  { name: "Jan", total: 120 },
  { name: "Fev", total: 125 },
  { name: "Mar", total: 122 },
  { name: "Abr", total: 130 },
  { name: "Mai", total: 135 },
  { name: "Jun", total: 142 },
];

export function DashboardChart() {
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
