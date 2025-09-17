import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileCheck, Download, Eye, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LinhaAuditoria {
  nfeChave: string;
  emissao: string;
  valorNF: number;
  perna1: {
    papel: "CONTRATANTE";
    transportadora: string;
    esperado: number;
    cteValor: number;
    icms: "Destacado" | "Sem destaque";
    pagavel: boolean;
  };
  perna2: {
    papel: "EXECUTORA";
    transportadora: string;
    regraAplicada: "Mín. 15" | "2,5%";
    esperado: number;
    cteValor: number | null;
    icms: "Destacado" | "Sem destaque" | "—";
    pagavel: boolean;
  };
  delta: {
    valor: number | null;
    perc: number | null;
  };
  nfVinculadaExecutora: boolean;
  compliance: "Conforme" | "Não conforme" | "Pendente";
}

interface ConfiguracaoRegras {
  regraTransvila: { percentual: number };
  regraNikkey: { percentual: number; minimo: number; limiteMinimoNF: number };
  tolerancia: { percentual: number };
}

const mockData: ConfiguracaoRegras & { linhas: LinhaAuditoria[] } = {
  regraTransvila: { percentual: 3.3 },
  regraNikkey: { percentual: 2.5, minimo: 15.0, limiteMinimoNF: 600.0 },
  tolerancia: { percentual: 2.0 },
  linhas: [
    {
      nfeChave: "352509QU0001",
      emissao: "2025-09-09",
      valorNF: 500.00,
      perna1: {
        papel: "CONTRATANTE",
        transportadora: "Transvila",
        esperado: 16.50,
        cteValor: 16.50,
        icms: "Destacado",
        pagavel: true
      },
      perna2: {
        papel: "EXECUTORA",
        transportadora: "Nikkey",
        regraAplicada: "Mín. 15",
        esperado: 15.00,
        cteValor: 15.00,
        icms: "Sem destaque",
        pagavel: false
      },
      delta: { valor: 0.00, perc: 0.00 },
      nfVinculadaExecutora: true,
      compliance: "Conforme"
    },
    {
      nfeChave: "352509QU0002",
      emissao: "2025-09-09",
      valorNF: 1000.00,
      perna1: {
        papel: "CONTRATANTE",
        transportadora: "Transvila",
        esperado: 33.00,
        cteValor: 33.00,
        icms: "Destacado",
        pagavel: true
      },
      perna2: {
        papel: "EXECUTORA",
        transportadora: "Nikkey",
        regraAplicada: "2,5%",
        esperado: 25.00,
        cteValor: 27.00,
        icms: "Sem destaque",
        pagavel: false
      },
      delta: { valor: 2.00, perc: 8.00 },
      nfVinculadaExecutora: true,
      compliance: "Não conforme"
    },
    {
      nfeChave: "352509QU0003",
      emissao: "2025-09-08",
      valorNF: 620.00,
      perna1: {
        papel: "CONTRATANTE",
        transportadora: "Transvila",
        esperado: 20.46,
        cteValor: 20.46,
        icms: "Destacado",
        pagavel: true
      },
      perna2: {
        papel: "EXECUTORA",
        transportadora: "Nikkey",
        regraAplicada: "2,5%",
        esperado: 15.50,
        cteValor: null,
        icms: "—",
        pagavel: false
      },
      delta: { valor: null, perc: null },
      nfVinculadaExecutora: false,
      compliance: "Pendente"
    }
  ]
};

export default function ConsultoriaDelta() {
  const [dados, setDados] = useState(mockData);
  const [filtros, setFiltros] = useState({
    periodo: "30dias",
    status: "todos",
    pagavel: "todos",
    regra: "todas"
  });
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [linhaSelecionada, setLinhaSelecionada] = useState<LinhaAuditoria | null>(null);
  const { toast } = useToast();

  const calcularRegras = (linha: LinhaAuditoria): LinhaAuditoria => {
    const { valorNF } = linha;
    
    // 1ª perna - Transvila (CONTRATANTE - com ICMS destacado e pagável devido à inversão fiscal)
    const esperadoTransvila = valorNF * (dados.regraTransvila.percentual / 100);
    
    // 2ª perna - Nikkey (EXECUTORA - sem ICMS, não pagável devido à inversão fiscal)
    const esperadoNikkey = valorNF <= dados.regraNikkey.limiteMinimoNF 
      ? dados.regraNikkey.minimo 
      : valorNF * (dados.regraNikkey.percentual / 100);
    
    const regraAplicada: "Mín. 15" | "2,5%" = valorNF <= dados.regraNikkey.limiteMinimoNF ? "Mín. 15" : "2,5%";
    
    // Delta (se houver CT-e executora)
    let deltaValor: number | null = null;
    let deltaPerc: number | null = null;
    
    if (linha.perna2.cteValor !== null) {
      deltaValor = linha.perna2.cteValor - esperadoNikkey;
      deltaPerc = esperadoNikkey > 0 ? (deltaValor / esperadoNikkey) * 100 : 0;
    }
    
    // Pagável: Transvila (CONTRATANTE) é quem paga devido à inversão fiscal
    // Nikkey (EXECUTORA) não é pagável pois não tem ICMS destacado
    const pagavelTransvila = linha.perna1.icms === "Destacado";
    const pagavelNikkey = false; // Nikkey nunca é pagável neste fluxo invertido
    
    // Compliance - adaptado para o fluxo fiscal invertido
    let compliance: "Conforme" | "Não conforme" | "Pendente" = "Pendente";
    
    if (linha.perna2.cteValor === null || !linha.nfVinculadaExecutora) {
      compliance = "Pendente";
    } else {
      // Critérios de conformidade para fluxo invertido:
      // 1. Transvila deve ter ICMS destacado
      // 2. Nikkey deve ter ICMS sem destaque ou não ter ICMS
      // 3. Delta dentro da tolerância
      
      if (linha.perna1.icms !== "Destacado") {
        compliance = "Não conforme"; // Transvila deve ter ICMS
      } else if (linha.perna2.icms === "Destacado") {
        compliance = "Não conforme"; // Nikkey não deve ter ICMS destacado
      } else if (deltaPerc !== null && Math.abs(deltaPerc) <= dados.tolerancia.percentual) {
        compliance = "Conforme";
      } else {
        compliance = "Não conforme"; // Delta fora da tolerância
      }
    }
    
    const resultado = {
      ...linha,
      perna1: {
        ...linha.perna1,
        esperado: esperadoTransvila,
        cteValor: esperadoTransvila, // Mock: mesmo valor
        pagavel: pagavelTransvila
      },
      perna2: {
        ...linha.perna2,
        regraAplicada,
        esperado: esperadoNikkey,
        pagavel: pagavelNikkey
      },
      delta: {
        valor: deltaValor,
        perc: deltaPerc
      },
      compliance
    };
    
    return resultado;
  };

  const verificarRegras = () => {
    console.log("Iniciando verificação de regras...");
    try {
      const linhasRecalculadas = dados.linhas.map((linha, index) => {
        console.log(`Calculando linha ${index + 1}:`, linha.nfeChave);
        return calcularRegras(linha);
      });
      console.log("Linhas recalculadas:", linhasRecalculadas);
      setDados({ ...dados, linhas: linhasRecalculadas });
      toast({
        title: "Regras verificadas",
        description: `${linhasRecalculadas.length} registros foram recalculados com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao verificar regras:", error);
      toast({
        title: "Erro ao verificar regras",
        description: "Ocorreu um erro durante o cálculo. Verifique o console.",
        variant: "destructive",
      });
    }
  };

  const linhasFiltradas = useMemo(() => {
    return dados.linhas.filter(linha => {
      if (filtros.status !== "todos" && linha.compliance !== filtros.status) return false;
      if (filtros.pagavel !== "todos") {
        const pagavelFiltro = filtros.pagavel === "sim";
        // Agora verifica a perna1 (Transvila) que é a pagável no fluxo invertido
        if (linha.perna1.pagavel !== pagavelFiltro) return false;
      }
      if (filtros.regra !== "todas" && linha.perna2.regraAplicada !== filtros.regra) return false;
      return true;
    });
  }, [dados.linhas, filtros]);

  const formatarMoeda = (valor: number | null) => {
    if (valor === null) return "—";
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatarDelta = (valor: number | null, perc: number | null) => {
    if (valor === null || perc === null) return "—";
    const sinal = valor >= 0 ? "+" : "";
    return `${sinal}${formatarMoeda(valor)} (${sinal}${perc.toFixed(1)}%)`;
  };

  const getComplianceBadge = (compliance: string) => {
    const variants = {
      "Conforme": "default",
      "Não conforme": "destructive",
      "Pendente": "secondary"
    } as const;
    
    return (
      <Badge variant={variants[compliance as keyof typeof variants] || "secondary"}>
        {compliance}
      </Badge>
    );
  };

  const getDeltaColor = (perc: number | null) => {
    if (perc === null) return "";
    if (Math.abs(perc) <= dados.tolerancia.percentual) return "text-green-600";
    return "text-red-600";
  };

  const isPagamentoDisponivel = (linha: LinhaAuditoria) => {
    // No fluxo invertido, Transvila (perna1) é quem é pagável
    return linha.perna1.pagavel && 
           linha.compliance === "Conforme" && 
           linha.delta.perc !== null && 
           Math.abs(linha.delta.perc) <= dados.tolerancia.percentual;
  };

  const handleVisualizarDetalhes = (linha: LinhaAuditoria) => {
    setLinhaSelecionada(linha);
    setDetalhesAberto(true);
  };

  const handleEnviarPagamento = (linha: LinhaAuditoria) => {
    if (!isPagamentoDisponivel(linha)) {
      toast({
        title: "Pagamento não disponível",
        description: "Esta linha não atende aos critérios para envio ao financeiro.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Enviado para pagamento",
      description: `NF-e ${linha.nfeChave} enviada para o setor financeiro - Transvila pagável: ${formatarMoeda(linha.perna1.cteValor)}`,
    });
  };

  const handleExportarCSV = () => {
    try {
      // Cabeçalhos do CSV
      const headers = [
        "NF-e",
        "Emissão", 
        "Valor NF",
        "Transvila Esperado",
        "Transvila CT-e",
        "Transvila ICMS",
        "Transvila Pagável",
        "Nikkey Regra",
        "Nikkey Esperado",
        "Nikkey CT-e",
        "Nikkey Delta Valor",
        "Nikkey Delta %",
        "Nikkey ICMS",
        "Nikkey Pagável",
        "Compliance"
      ];

      // Converter dados para CSV
      const csvData = linhasFiltradas.map(linha => [
        linha.nfeChave,
        new Date(linha.emissao).toLocaleDateString('pt-BR'),
        linha.valorNF.toFixed(2),
        linha.perna1.esperado.toFixed(2),
        linha.perna1.cteValor.toFixed(2),
        linha.perna1.icms,
        linha.perna1.pagavel ? "Sim" : "Não",
        linha.perna2.regraAplicada,
        linha.perna2.esperado.toFixed(2),
        linha.perna2.cteValor?.toFixed(2) || "—",
        linha.delta.valor?.toFixed(2) || "—",
        linha.delta.perc?.toFixed(1) + "%" || "—",
        linha.perna2.icms,
        linha.perna2.pagavel ? "Sim" : "Não",
        linha.compliance
      ]);

      // Criar conteúdo CSV
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(","))
        .join("\n");

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `consultoria-delta-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "CSV exportado",
        description: `${linhasFiltradas.length} registros foram exportados com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro durante a exportação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Consultoria Delta</h1>
          <p className="text-muted-foreground">Auditoria Qubit → Transvila → Nikkey</p>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={filtros.periodo} onValueChange={(value) => setFiltros({...filtros, periodo: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">7 dias</SelectItem>
                  <SelectItem value="30dias">30 dias</SelectItem>
                  <SelectItem value="90dias">90 dias</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtros.status} onValueChange={(value) => setFiltros({...filtros, status: value})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Conforme">Conforme</SelectItem>
                  <SelectItem value="Não conforme">Não conforme</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtros.pagavel} onValueChange={(value) => setFiltros({...filtros, pagavel: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Pagável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtros.regra} onValueChange={(value) => setFiltros({...filtros, regra: value})}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Regra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Mín. 15">Mínimo</SelectItem>
                  <SelectItem value="2,5%">2,5%</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 ml-auto">
                <Button onClick={() => {
                  console.log("Botão Verificar regras clicado!");
                  verificarRegras();
                }} variant="outline" size="sm">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Verificar regras
                </Button>
                <Button onClick={() => {
                  console.log("Botão Exportar CSV clicado!");
                  handleExportarCSV();
                }} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Auditoria por NF-e ({linhasFiltradas.length} registros)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="border-r">NF-e</TableHead>
                  <TableHead rowSpan={2} className="border-r">Emissão</TableHead>
                  <TableHead rowSpan={2} className="border-r">Valor NF</TableHead>
                  <TableHead colSpan={4} className="text-center border-r bg-muted/50">1ª perna – Transvila (CONTRATANTE)</TableHead>
                  <TableHead colSpan={6} className="text-center border-r bg-muted/50">2ª perna – Nikkey (EXECUTORA)</TableHead>
                  <TableHead rowSpan={2} className="border-r">Compliance</TableHead>
                  <TableHead rowSpan={2}>Ações</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="border-r">Esperado</TableHead>
                  <TableHead className="border-r">CT-e Contratante</TableHead>
                  <TableHead className="border-r">ICMS</TableHead>
                  <TableHead className="border-r">Pagável</TableHead>
                  <TableHead className="border-r">Regra</TableHead>
                  <TableHead className="border-r">Esperado</TableHead>
                  <TableHead className="border-r">CT-e Executora</TableHead>
                  <TableHead className="border-r">Delta</TableHead>
                  <TableHead className="border-r">ICMS</TableHead>
                  <TableHead className="border-r">Pagável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhasFiltradas.map((linha) => (
                  <TableRow key={linha.nfeChave}>
                    <TableCell className="border-r font-mono text-xs">{linha.nfeChave}</TableCell>
                    <TableCell className="border-r">{new Date(linha.emissao).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="border-r font-semibold">{formatarMoeda(linha.valorNF)}</TableCell>
                    
                    {/* 1ª perna */}
                    <TableCell className="border-r">{formatarMoeda(linha.perna1.esperado)}</TableCell>
                    <TableCell className="border-r">{formatarMoeda(linha.perna1.cteValor)}</TableCell>
                    <TableCell className="border-r">
                      <Badge 
                        variant={linha.perna1.icms === "Destacado" ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {linha.perna1.icms}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r">
                      <Badge 
                        variant={linha.perna1.pagavel ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {linha.perna1.pagavel ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    
                    {/* 2ª perna */}
                    <TableCell className="border-r">
                      <Badge variant="outline" className="text-xs">{linha.perna2.regraAplicada}</Badge>
                    </TableCell>
                    <TableCell className="border-r">{formatarMoeda(linha.perna2.esperado)}</TableCell>
                    <TableCell className="border-r">{formatarMoeda(linha.perna2.cteValor)}</TableCell>
                    <TableCell className={cn("border-r", getDeltaColor(linha.delta.perc))}>
                      {formatarDelta(linha.delta.valor, linha.delta.perc)}
                    </TableCell>
                    <TableCell className="border-r">
                      <Badge 
                        variant={linha.perna2.icms === "Destacado" ? "default" : linha.perna2.icms === "Sem destaque" ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {linha.perna2.icms}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r">
                      <Badge variant={linha.perna2.pagavel ? "default" : "secondary"} className="text-xs">
                        {linha.perna2.pagavel ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="border-r">{getComplianceBadge(linha.compliance)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleVisualizarDetalhes(linha)}
                          title="Visualizar detalhes"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={!isPagamentoDisponivel(linha)}
                          onClick={() => handleEnviarPagamento(linha)}
                          className={cn(!isPagamentoDisponivel(linha) && "opacity-50")}
                          title={isPagamentoDisponivel(linha) ? "Enviar para pagamento" : "Não disponível para pagamento"}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={detalhesAberto} onOpenChange={setDetalhesAberto}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da NF-e</DialogTitle>
            <DialogDescription>
              Informações completas da auditoria
            </DialogDescription>
          </DialogHeader>
          
          {linhaSelecionada && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações da NF-e</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Chave da NF-e</label>
                    <p className="font-mono">{linhaSelecionada.nfeChave}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Emissão</label>
                    <p>{new Date(linhaSelecionada.emissao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor da NF-e</label>
                    <p className="font-semibold text-lg">{formatarMoeda(linhaSelecionada.valorNF)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status de Compliance</label>
                    <div className="mt-1">{getComplianceBadge(linhaSelecionada.compliance)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Detalhes das Pernas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1ª Perna - Transvila */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">1ª Perna - Transvila (CONTRATANTE)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Transportadora</label>
                      <p>{linhaSelecionada.perna1.transportadora}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valor Esperado</label>
                      <p>{formatarMoeda(linhaSelecionada.perna1.esperado)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valor CT-e</label>
                      <p>{formatarMoeda(linhaSelecionada.perna1.cteValor)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ICMS</label>
                      <div className="mt-1">
                        <Badge 
                          variant={linhaSelecionada.perna1.icms === "Destacado" ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          {linhaSelecionada.perna1.icms}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Pagável</label>
                      <div className="mt-1">
                        <Badge 
                          variant={linhaSelecionada.perna1.pagavel ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          {linhaSelecionada.perna1.pagavel ? "Sim" : "Não"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2ª Perna - Nikkey */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2ª Perna - Nikkey (EXECUTORA)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Transportadora</label>
                      <p>{linhaSelecionada.perna2.transportadora}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Regra Aplicada</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {linhaSelecionada.perna2.regraAplicada}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valor Esperado</label>
                      <p>{formatarMoeda(linhaSelecionada.perna2.esperado)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valor CT-e</label>
                      <p>{formatarMoeda(linhaSelecionada.perna2.cteValor)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Delta</label>
                      <p className={getDeltaColor(linhaSelecionada.delta.perc)}>
                        {formatarDelta(linhaSelecionada.delta.valor, linhaSelecionada.delta.perc)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ICMS</label>
                      <div className="mt-1">
                        <Badge 
                          variant={linhaSelecionada.perna2.icms === "Destacado" ? "default" : linhaSelecionada.perna2.icms === "Sem destaque" ? "secondary" : "outline"} 
                          className="text-xs"
                        >
                          {linhaSelecionada.perna2.icms}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Pagável</label>
                      <div className="mt-1">
                        <Badge variant={linhaSelecionada.perna2.pagavel ? "default" : "secondary"} className="text-xs">
                          {linhaSelecionada.perna2.pagavel ? "Sim" : "Não"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ações do Modal */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetalhesAberto(false)}>
                  Fechar
                </Button>
                <Button 
                  disabled={!isPagamentoDisponivel(linhaSelecionada)}
                  onClick={() => {
                    handleEnviarPagamento(linhaSelecionada);
                    setDetalhesAberto(false);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar p/ Pagamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}