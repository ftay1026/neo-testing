import { Badge } from "@/components/ui/badge"
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { useCredits } from "@/hooks/use-credits";
import { cn } from "@/lib/utils";

export function CreditsNavItem() {
  const { credits, isLoading } = useCredits();

  return (
    <div className="flex items-center gap-2">
      <Badge className="border-secondary text-secondary hover:bg-primary/40">
        {isLoading ? (
          "Loading..."
        ) : (
          `${credits} credits remaining`
        )}
      </Badge>
      <Link href="/app/credits" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-secondary text-secondary-foreground hover:bg-secondary/90")}>
        Topup
      </Link>
    </div>
  )
}