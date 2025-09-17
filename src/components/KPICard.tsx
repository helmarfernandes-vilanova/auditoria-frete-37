import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ title, value, subtitle, trend, icon, className }: KPICardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{value}</p>
            {subtitle && (
              <p className={cn(
                "text-xs",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0 ml-2">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}