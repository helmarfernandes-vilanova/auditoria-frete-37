import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "Conforme" | "Divergente" | "Pendente" | "Vinculado" | "Sem título" | "Pago" | "Em aberto" | "—" | 
          "Não conforme" | "Destacado" | "Não destacado" | "Sim" | "Não" | "Único" | "Possível duplicado" | 
          "Par subcontratação" | "EXECUTORA" | "CONTRATANTE";
  className?: string;
  tooltip?: string;
}

export function StatusBadge({ status, className, tooltip }: StatusBadgeProps) {
  const getVariant = (status: string) => {
    switch (status) {
      case "Conforme":
      case "Pago":
      case "Vinculado":
      case "Destacado":
      case "Sim":
      case "Único":
        return "default";
      case "Divergente":
      case "Não conforme":
        return "destructive";
      case "Pendente":
      case "Em aberto":
        return "secondary";
      case "Sem título":
      case "—":
      case "Não destacado":
      case "Não":
      case "Possível duplicado":
        return "outline";
      case "Par subcontratação":
      case "EXECUTORA":
      case "CONTRATANTE":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getColor = (status: string) => {
    switch (status) {
      case "Conforme":
      case "Pago":
      case "Vinculado":
      case "Destacado":
      case "Sim":
      case "Único":
        return "text-green-700 bg-green-50 border-green-200";
      case "Divergente":
      case "Não conforme":
        return "text-red-700 bg-red-50 border-red-200";
      case "Pendente":
      case "Em aberto":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "Par subcontratação":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "EXECUTORA":
        return "text-purple-700 bg-purple-50 border-purple-200";
      case "CONTRATANTE":
        return "text-indigo-700 bg-indigo-50 border-indigo-200";
      case "Possível duplicado":
        return "text-orange-700 bg-orange-50 border-orange-200";
      case "Sem título":
      case "—":
      case "Não destacado":
      case "Não":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "";
    }
  };

  const badge = (
    <Badge 
      variant={getVariant(status)}
      className={cn(getColor(status), className)}
    >
      {status}
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}