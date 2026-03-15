"use client";

import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { format } from "date-fns";

interface DailyChartProps {
  data: { date: string; orders: number; converted: number; invoices: number }[];
}

export default function DailyChart({ data }: DailyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "MM/dd"),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="orders"
          name="주문"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="converted"
          name="변환"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
        />
        <Line
          type="monotone"
          dataKey="invoices"
          name="송장"
          stroke="#a855f7"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
