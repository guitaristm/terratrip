"use client";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import type { Expense } from "@/lib/types";

const COLORS = {
  food: "#f97316",
  hotel: "#3b82f6",
  transport: "#a855f7",
  shopping: "#ec4899",
  tickets: "#22c55e",
  other: "#78716c",
};

interface SpendingChartProps {
  expenses: Expense[];
  currency: string;
}

export function SpendingChart({ expenses, currency }: SpendingChartProps) {
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] ?? 0) + e.amount;
    }
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const dailyData = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const e of expenses) {
      const d = new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      byDate[d] = (byDate[d] ?? 0) + e.amount;
    }
    return Object.entries(byDate)
      .map(([date, amount]) => ({ date, amount: Math.round(amount) }))
      .slice(-7);
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="bg-white border border-stone-100 rounded-2xl p-6 text-center py-16">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-sm text-stone-500">No expense data yet</p>
        <p className="text-xs text-stone-400 mt-1">Add expenses to see your spending charts</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Bar chart — daily spending */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Daily Spending</h3>
        {dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12 }}
                formatter={(v) => [`${Number(v).toLocaleString()} ${currency}`, "Spent"]}
              />
              <Bar dataKey="amount" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-stone-400 text-sm">No data</div>
        )}
      </div>

      {/* Pie chart — by category */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">By Category</h3>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={35}
              >
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] ?? "#78716c"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12 }}
                formatter={(v) => [`${Number(v).toLocaleString()} ${currency}`]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#78716c" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-stone-400 text-sm">No data</div>
        )}
      </div>
    </div>
  );
}
