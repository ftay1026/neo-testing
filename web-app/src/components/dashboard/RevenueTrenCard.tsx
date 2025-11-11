"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueData {
  name: string;
  revenue: number;
}

interface RevenueTrendCardProps {
  data: RevenueData[];
}

export default function RevenueTrendCard({ data }: RevenueTrendCardProps) {
  return (
    <div
      className="bg-dashboard-bg text-gray-200 p-4 rounded-xl shadow-md 
      w-full  md:w-full 
      h-[250px] sm:h-[300px] md:h-[395px] 
      transition-transform hover:scale-[1.02] duration-200"
    >
      <p className="text-xs sm:text-lg text-primary/50 mb-2">Revenue Trend</p>
      <div className="h-[85%] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={15} />
            <Tooltip
              contentStyle={{ backgroundColor: "#222", border: "none" }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend
              verticalAlign="bottom"
              height={20}
              wrapperStyle={{ color: "#3b82f6", fontSize: "12px" }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
