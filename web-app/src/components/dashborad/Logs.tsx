interface LogsProps {
  email: string;
  amount: number;
  timeAgo: string;
}

export default function Logs({ 
  email, 
  amount, 
  timeAgo 
}: LogsProps) {
  return (
    <div className=" text-white rounded-lg border-b border-black/10 p-4 max-w-full">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-white mb-1">
            {email}
          </p>
          <p className="text-sm text-primary/50">
            Purchased ${amount} package
          </p>
        </div>
        <span className="text-xs text-primary/50 whitespace-nowrap ml-4">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}

