"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type PackageData = {
  name: string;
  value: number;
  color: string;
} & Record<string, unknown>;

interface PackageDistributionCardProps {
  data: PackageData[];
}

export default function PackageDistributionCard({ data }: PackageDistributionCardProps) {
  return (
    <div
      className="bg-dashboard-bg text-gray-200 p-4 rounded-xl shadow-md 
      w-full  md:w-full
      h-[250px] sm:h-[300px] md:h-[395px] 
      transition-transform hover:scale-[1.02] duration-200"
    >
      <p className="text-xs sm:text-lg text-primary/50 mb-2">Package Distribution</p>
      <div className="flex justify-center items-center h-[85%]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius="70%"
              innerRadius="40%"
              label={({ name, value }) => `$${name} Package: ${value}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#222", border: "none" }}
              itemStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
