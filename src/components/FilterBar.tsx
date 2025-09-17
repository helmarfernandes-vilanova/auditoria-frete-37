import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, RotateCcw, Save } from "lucide-react";
import { useAuditoria } from "@/contexts/AuditoriaContext";
import { toast } from "@/hooks/use-toast";

export function FilterBar() {
  const { filters, setFilters, resetFilters, ctes } = useAuditoria();
  const [localFilters, setLocalFilters] = useState(filters);

  // Extrair embarcadores únicos dos CT-es importados
  const embarcadores = Array.from(new Set(ctes.map(cte => cte.embarcador))).sort();
  
  // Extrair transportadores únicos dos CT-es importados  
  const transportadores = Array.from(new Set(ctes.map(cte => cte.emitNome))).sort();

  // Sync local filters with global filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const handleSaveFilter = () => {
    // Simula salvar filtro
    toast({
      title: "Filtro salvo",
      description: "Filtro salvo com sucesso!"
    });
  };

  const addFilter = (type: string, value: string) => {
    handleFilterChange(type, [...(localFilters[type as keyof typeof localFilters] as string[]), value]);
  };

  const removeFilter = (type: string, value: string) => {
    handleFilterChange(type, (localFilters[type as keyof typeof localFilters] as string[]).filter(v => v !== value));
  };

  const handleSelectFilter = (type: string, value: string) => {
    if (value === "todos") {
      // Aplica filtro "Todos" - limpa filtros específicos para mostrar todos
      handleFilterChange(type, []);
    } else {
      // Adiciona o filtro se não existir
      const currentFilters = localFilters[type as keyof typeof localFilters] as string[];
      if (!currentFilters.includes(value)) {
        addFilter(type, value);
      }
    }
  };

  // Helper function to get current selection for dropdowns
  const getCurrentSelection = (type: string) => {
    const filters = localFilters[type as keyof typeof localFilters] as string[];
    if (!filters || filters.length === 0) {
      return "todos";
    }
    return filters.length === 1 ? filters[0] : "multiplos";
  };

  return (
    <Card>
      <CardContent className="p-3 sm:p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">🔍 Filtrar Documentos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 w-full sm:w-auto">
            <Select 
              value={localFilters.periodo} 
              onValueChange={(value) => handleFilterChange("periodo", value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="📅 Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">📅 Última semana</SelectItem>
                <SelectItem value="30dias">📅 Último mês</SelectItem>
                <SelectItem value="90dias">📅 Últimos 3 meses</SelectItem>
                <SelectItem value="personalizado">📅 Escolher datas</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={getCurrentSelection("embarcadores")} 
              onValueChange={(value) => handleSelectFilter("embarcadores", value)}
              disabled={embarcadores.length === 0}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={embarcadores.length === 0 ? "🏢 Nenhum embarcador" : "🏢 Quem enviou a carga"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">🏢 Todas as empresas</SelectItem>
                {embarcadores.map(embarcador => (
                  <SelectItem key={embarcador} value={embarcador}>🏢 {embarcador}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={getCurrentSelection("transportadoras")} 
              onValueChange={(value) => handleSelectFilter("transportadoras", value)}
              disabled={transportadores.length === 0}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={transportadores.length === 0 ? "🚛 Nenhum transportador" : "🚛 Quem transportou"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">🚛 Todos os transportadores</SelectItem>
                {transportadores.map(transportador => (
                  <SelectItem key={transportador} value={transportador}>🚛 {transportador}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={getCurrentSelection("statusAuditoria")} 
              onValueChange={(value) => handleSelectFilter("statusAuditoria", value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="✅ Situação dos documentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">✅ Todas as situações</SelectItem>
                <SelectItem value="Conforme">✅ Tudo certo</SelectItem>
                <SelectItem value="Divergente">❌ Com problema</SelectItem>
                <SelectItem value="Pendente">⏳ Aguardando análise</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={localFilters.subcontratacaoTransvila} 
              onValueChange={(value) => handleFilterChange("subcontratacaoTransvila", value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="💼 Subcontratação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">💼 Subcontratação</SelectItem>
                <SelectItem value="sim">💼 Sim</SelectItem>
                <SelectItem value="nao">💼 Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros ativos */}
        <div className="flex flex-wrap gap-2">
          {localFilters.embarcadores.map(embarcador => (
            <Badge key={embarcador} variant="secondary" className="cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200">
              🏢 {embarcador}
              <button 
                className="ml-2 text-xs hover:text-red-600 font-bold"
                onClick={() => removeFilter("embarcadores", embarcador)}
              >
                ✕
              </button>
            </Badge>
          ))}
          {localFilters.transportadoras.map(transportador => (
            <Badge key={transportador} variant="secondary" className="cursor-pointer bg-purple-100 text-purple-700 hover:bg-purple-200">
              🚛 {transportador}
              <button 
                className="ml-2 text-xs hover:text-red-600 font-bold"
                onClick={() => removeFilter("transportadoras", transportador)}
              >
                ✕
              </button>
            </Badge>
          ))}
          {localFilters.statusAuditoria.map(status => (
            <Badge key={status} variant="secondary" className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-200">
              ✅ Situação: {status === "Conforme" ? "Tudo certo" : status === "Divergente" ? "Com problema" : "Aguardando"}
              <button 
                className="ml-2 text-xs hover:text-red-600 font-bold"
                onClick={() => removeFilter("statusAuditoria", status)}
              >
                ✕
              </button>
            </Badge>
          ))}
          {localFilters.tomador.length > 0 && (
            <Badge key="tomador-info" variant="outline" className="cursor-default bg-blue-100 text-blue-700">
              💳 Filtro não aplicável - Sempre pagamos o frete
            </Badge>
          )}
          {localFilters.subcontratacaoTransvila !== "todos" && (
            <Badge variant="secondary" className="cursor-pointer bg-orange-100 text-orange-700 hover:bg-orange-200">
              💼 Subcontratação: {localFilters.subcontratacaoTransvila === "sim" ? "Sim" : "Não"}
              <button 
                className="ml-2 text-xs hover:text-red-600 font-bold"
                onClick={() => handleFilterChange("subcontratacaoTransvila", "todos")}
              >
                ✕
              </button>
            </Badge>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={applyFilters} size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            🔍 Aplicar Filtros
          </Button>
          <Button onClick={handleResetFilters} variant="outline" size="sm" className="w-full sm:w-auto">
            <RotateCcw className="h-3 w-3 mr-1" />
            🔄 Limpar Tudo
          </Button>
          <Button onClick={handleSaveFilter} variant="outline" size="sm" className="w-full sm:w-auto">
            <Save className="h-3 w-3 mr-1" />
            💾 Salvar Filtro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}