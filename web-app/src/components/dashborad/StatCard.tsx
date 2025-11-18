import { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: number | string;
    icon: ReactNode;
}

export default function StatCard({ title, value, icon }: StatCardProps) {
    return (
        <div
            className="
            flex items-center justify-between 
            bg-dashboard-bg text-gray-200 p-4 rounded-xl shadow-md
            w-full   md:max-w-full 
            h-auto sm:h-[110px] 
            transition-transform hover:scale-[1.02] duration-200
        "
        >

            <div>
                <p className="text-xs sm:text-sm text-primary/50">{title}</p>
                <p className="text-lg sm:text-2xl font-semibold mt-1 break-words">{value}</p>
            </div>
            <div className="bg-accent p-2 sm:p-3 rounded-lg text-white flex items-center justify-center">
                {icon}
            </div>
        </div>
    );
}
