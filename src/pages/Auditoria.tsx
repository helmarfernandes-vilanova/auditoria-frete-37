import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, Eye, AlertTriangle, CheckCircle, Clock, RefreshCw, HelpCircle } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { FilterBar } from "@/components/FilterBar";
import { CTesTable } from "@/components/CTesTable";
import { UploadModal } from "@/components/UploadModal";
import { CTDetailsDrawer } from "@/components/CTDetailsDrawer";
import { HelpPanel } from "@/components/HelpPanel";
import { useAuditoria } from "@/contexts/AuditoriaContext";
import { CTe, matchSubTransvila } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

export default function Auditoria() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCte, setSelectedCte] = useState<CTe | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { ctes, filters, verificarCompliance } = useAuditoria();

  const handleViewDetails = (cte: CTe) => {
    setSelectedCte(cte);
    setIsDetailsDrawerOpen(true);
  };

  const handleExportCSV = () => {
    // Mock CSV export
    const csvContent = "data:text/csv;charset=utf-8,Chave,Emissao,Embarcador,Frete,Status\n" +
      filteredCtes.map(cte => 
        `${cte.chave},${cte.emissao},${cte.embarcador},${cte.vTPrest},${cte.statusAuditoria}`
      ).join('\n');
    
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ctes-auditoria-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportação realizada",
      description: "Arquivo CSV foi baixado com sucesso."
    });
  };

  // Aplicar filtros
  const filteredCtes = useMemo(() => {
    let filtered = [...ctes];

    // Filtro de período
    const now = new Date();
    const filterDate = new Date();
    
    if (filters.periodo === "7dias") {
      filterDate.setDate(now.getDate() - 7);
    } else if (filters.periodo === "30dias") {
      filterDate.setDate(now.getDate() - 30);
    } else if (filters.periodo === "90dias") {
      filterDate.setDate(now.getDate() - 90);
    }

    if (filters.periodo !== "personalizado") {
      filtered = filtered.filter(cte => new Date(cte.emissao) >= filterDate);
    } else if (filters.dataInicio && filters.dataFim) {
      filtered = filtered.filter(cte => {
        const emissaoDate = new Date(cte.emissao);
        return emissaoDate >= new Date(filters.dataInicio!) && emissaoDate <= new Date(filters.dataFim!);
      });
    }

    // Filtro de embarcadores
    if (filters.embarcadores.length > 0) {
      filtered = filtered.filter(cte => filters.embarcadores.includes(cte.embarcador));
    }

    // Filtro de transportadoras
    if (filters.transportadoras.length > 0) {
      filtered = filtered.filter(cte => filters.transportadoras.includes(cte.transportador));
    }

    // Filtro de status auditoria
    if (filters.statusAuditoria.length > 0) {
      filtered = filtered.filter(cte => filters.statusAuditoria.includes(cte.statusAuditoria));
    }

    // Filtro de tomador
    if (filters.tomador.length > 0) {
      filtered = filtered.filter(cte => filters.tomador.includes(cte.tomador));
    }

    // Filtro de subcontratação Transvila
    if (filters.subcontratacaoTransvila === "sim") {
      filtered = filtered.filter(cte => matchSubTransvila(cte));
    } else if (filters.subcontratacaoTransvila === "nao") {
      filtered = filtered.filter(cte => !matchSubTransvila(cte));
    }

    return filtered;
  }, [ctes, filters]);

  // Calcular KPIs
  const kpis = useMemo(() => {
    const total = filteredCtes.length;
    const totalFrete = filteredCtes.reduce((sum, cte) => sum + cte.vTPrest, 0);
    const divergencias = filteredCtes.filter(cte => cte.statusAuditoria === "Divergente").length;
    const semVinculo = filteredCtes.filter(cte => cte.financeiro.vinculo === "Sem título").length;
    const valorRecuperar = filteredCtes
      .filter(cte => cte.statusAuditoria === "Divergente" && cte.comparacaoTabela.delta > 0)
      .reduce((sum, cte) => sum + cte.comparacaoTabela.delta, 0);

    return {
      total,
      totalFrete,
      divergencias,
      divergenciasPerc: total > 0 ? (divergencias / total) * 100 : 0,
      valorRecuperar,
      semVinculo
    };
  }, [filteredCtes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">📋 Sistema de Auditoria de Frete</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Controle e verificação dos documentos de transporte do Grupo Vila Nova
          </p>
        </div>
        <Button 
          onClick={() => setIsHelpOpen(true)} 
          variant="outline" 
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          ❓ Como Usar
        </Button>
      </div>

      {/* Filtros */}
      <FilterBar />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          title="📄 Documentos Processados"
          value={kpis.total}
          icon={<Eye className="h-5 w-5 text-primary" />}
        />
        <KPICard
          title="💰 Valor Total dos Fretes"
          value={formatCurrency(kpis.totalFrete)}
          icon={<FileSpreadsheet className="h-5 w-5 text-blue-600" />}
        />
        <KPICard
          title="⚠️ Documentos com Problema"
          value={kpis.divergencias}
          subtitle={`${kpis.divergenciasPerc.toFixed(1)}% do total`}
          trend={kpis.divergenciasPerc > 10 ? "down" : "neutral"}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        />
        <KPICard
          title="💵 Valor para Recuperar"
          value={formatCurrency(kpis.valorRecuperar)}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        />
        <KPICard
          title="📋 Sem Vínculo Financeiro"
          value={kpis.semVinculo}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
        />
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle>📄 Documentos de Transporte Auditados</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={verificarCompliance} variant="outline" className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                🔄 Verificar Situação
              </Button>
              <Button onClick={() => setIsUploadModalOpen(true)} className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                📁 Importar Documentos
              </Button>
              <Button variant="outline" onClick={handleExportCSV} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                📊 Exportar Planilha
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <CTesTable 
              ctes={filteredCtes}
              onViewDetails={handleViewDetails}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <UploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
      />

      <CTDetailsDrawer
        cte={selectedCte}
        open={isDetailsDrawerOpen}
        onOpenChange={setIsDetailsDrawerOpen}
      />

      <HelpPanel
        open={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}