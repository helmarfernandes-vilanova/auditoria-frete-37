import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, CheckCircle, XCircle, AlertTriangle, Send, Eye } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { type CTe } from "@/data/mockData";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuditoria } from "@/contexts/AuditoriaContext";

export default function Pagamentos() {
  const { ctes } = useAuditoria();  // Usar dados do contexto
  const [situacaoFilter, setSituacaoFilter] = useState<string>("todos");
  const [prestadorFilter, setPrestadorFilter] = useState<string>("todos");
  const [embarcadorFilter, setEmbarcadorFilter] = useState<string>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filtros únicos para os selects
  const prestadores = useMemo(() => {
    const uniquePrestadores = Array.from(new Set(ctes.map(cte => cte.emitNome)));
    return uniquePrestadores.sort();
  }, [ctes]);

  const embarcadores = useMemo(() => {
    const uniqueEmbarcadores = Array.from(new Set(ctes.map(cte => cte.embarcador)));
    return uniqueEmbarcadores.sort();
  }, [ctes]);

  // Aplicar filtros
  const filteredCtes = useMemo(() => {
    return ctes.filter(cte => {
      // Filtro por situação
      if (situacaoFilter !== "todos") {
        const pagavel = cte.pagavel && cte.statusCompliance === "Conforme" && cte.duplicidade.status === "Único" && cte.nfeChave && cte.subcontratacao.tipo !== "CONTRATANTE";
        if (situacaoFilter === "pagavel" && !pagavel) return false;
        if (situacaoFilter === "bloqueado" && pagavel) return false;
      }
      
      // Filtro por prestador
      if (prestadorFilter !== "todos" && cte.emitNome !== prestadorFilter) return false;
      
      // Filtro por embarcador
      if (embarcadorFilter !== "todos" && cte.embarcador !== embarcadorFilter) return false;
      
      // Filtro por período
      if (dateRange?.from || dateRange?.to) {
        const cteDate = startOfDay(parseISO(cte.dhEmi));
        if (dateRange.from && isBefore(cteDate, startOfDay(dateRange.from))) return false;
        if (dateRange.to && isAfter(cteDate, endOfDay(dateRange.to))) return false;
      }
      
      return true;
    });
  }, [situacaoFilter, prestadorFilter, embarcadorFilter, dateRange]);

  // Cálculo dos KPIs
  const kpis = useMemo(() => {
    const total = filteredCtes.length;
    const pagaveisHoje = filteredCtes.filter(cte => {
      return cte.pagavel && 
             cte.statusCompliance === "Conforme" && 
             cte.duplicidade.status === "Único" && 
             cte.nfeChave && 
             cte.subcontratacao.tipo !== "CONTRATANTE" &&
             (cte.ciot.situacao === "Válido" || cte.ciot.situacao === "Não aplicável");
    }).length;
    
    const bloqueados = filteredCtes.filter(cte => {
      return !(cte.pagavel && 
               cte.statusCompliance === "Conforme" && 
               cte.duplicidade.status === "Único" && 
               cte.nfeChave && 
               cte.subcontratacao.tipo !== "CONTRATANTE" &&
               (cte.ciot.situacao === "Válido" || cte.ciot.situacao === "Não aplicável"));
    }).length;
    
    const pagos = filteredCtes.filter(cte => cte.financeiro.status === "Pago").length;
    
    const valorPagavel = filteredCtes.filter(cte => {
      return cte.pagavel && 
             cte.statusCompliance === "Conforme" && 
             cte.duplicidade.status === "Único" && 
             cte.nfeChave && 
             cte.subcontratacao.tipo !== "CONTRATANTE" &&
             (cte.ciot.situacao === "Válido" || cte.ciot.situacao === "Não aplicável");
    }).reduce((acc, cte) => acc + cte.vTPrest, 0);
    
    const valorBloqueado = filteredCtes.filter(cte => {
      return !(cte.pagavel && 
               cte.statusCompliance === "Conforme" && 
               cte.duplicidade.status === "Único" && 
               cte.nfeChave && 
               cte.subcontratacao.tipo !== "CONTRATANTE" &&
               (cte.ciot.situacao === "Válido" || cte.ciot.situacao === "Não aplicável"));
    }).reduce((acc, cte) => acc + cte.vTPrest, 0);
    
    return { 
      total, 
      pagaveisHoje, 
      bloqueados, 
      pagos,
      valorPagavel,
      valorBloqueado
    };
  }, [filteredCtes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMotivoBloqueio = (cte: CTe) => {
    const motivos: string[] = [];
    
    if (cte.statusCompliance !== "Conforme") motivos.push("Não conforme");
    if (cte.duplicidade.status !== "Único") motivos.push("Duplicidade");
    if (!cte.nfeChave) motivos.push("Sem NF-e");
    if (cte.subcontratacao.tipo === "CONTRATANTE") motivos.push("CONTRATANTE (não pagável)");
    if (cte.ciot.situacao === "Ausente") motivos.push("CIOT ausente");
    if (!cte.pagavel) motivos.push("Não pagável");
    
    return motivos.length > 0 ? motivos.join(", ") : "—";
  };

  const isPagavel = (cte: CTe) => {
    return cte.pagavel && 
           cte.statusCompliance === "Conforme" && 
           cte.duplicidade.status === "Único" && 
           cte.nfeChave && 
           cte.subcontratacao.tipo !== "CONTRATANTE" &&
           (cte.ciot.situacao === "Válido" || cte.ciot.situacao === "Não aplicável");
  };

  const getSituacaoBadge = (cte: CTe) => {
    if (cte.financeiro.status === "Pago") {
      return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Pago</Badge>;
    }
    
    if (isPagavel(cte)) {
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Pode Pagar</Badge>;
    }
    
    return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">Bloqueado</Badge>;
  };

  const handleEnviarPagamento = (cte: CTe) => {
    if (!isPagavel(cte)) {
      toast.error("CTe não está elegível para pagamento");
      return;
    }
    
    toast.success(`CTe ${cte.numero} enviado para pagamento`);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
        <p className="text-muted-foreground">
          Gate único de liberação de pagamentos - só processa quando todas as regras de compliance passam
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <KPICard
          title="Total"
          value={kpis.total}
          icon={<DollarSign className="h-4 w-4 text-primary" />}
        />
        <KPICard
          title="Pode Pagar Hoje"
          value={kpis.pagaveisHoje}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        />
        <KPICard
          title="Bloqueados"
          value={kpis.bloqueados}
          icon={<XCircle className="h-4 w-4 text-red-600" />}
        />
        <KPICard
          title="Pagos"
          value={kpis.pagos}
          icon={<CheckCircle className="h-4 w-4 text-blue-600" />}
        />
        <KPICard
          title="Valor Pagável"
          value={formatCurrency(kpis.valorPagavel)}
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
        />
        <KPICard
          title="Valor Bloqueado"
          value={formatCurrency(kpis.valorBloqueado)}
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      "Selecione o período"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Situação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Situação</label>
              <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="pagavel">Pode Pagar</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prestador */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Prestador</label>
              <Select value={prestadorFilter} onValueChange={setPrestadorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {prestadores.map(prestador => (
                    <SelectItem key={prestador} value={prestador}>{prestador}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Embarcador */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Embarcador</label>
              <Select value={embarcadorFilter} onValueChange={setEmbarcadorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {embarcadores.map(embarcador => (
                    <SelectItem key={embarcador} value={embarcador}>{embarcador}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setSituacaoFilter("todos");
              setPrestadorFilter("todos");
              setEmbarcadorFilter("todos");
              setDateRange(undefined);
            }}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Títulos para Pagamento</CardTitle>
          <CardDescription>
            {filteredCtes.length} título{filteredCtes.length !== 1 ? 's' : ''} encontrado{filteredCtes.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CTe</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Embarcador</TableHead>
                  <TableHead>Tipo Serviço</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>NF-e</TableHead>
                  <TableHead>CIOT</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Duplicidade</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Motivo Bloqueio</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCtes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      {ctes.length === 0 ? (
                        <div className="flex flex-col items-center gap-4">
                          <DollarSign className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <p className="text-lg font-medium">Nenhum documento para pagamento</p>
                            <p className="text-sm text-muted-foreground">
                              Importe arquivos XML na página de Auditoria para visualizar títulos aqui.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <p className="text-lg font-medium">Nenhum título encontrado</p>
                            <p className="text-sm text-muted-foreground">
                              Tente ajustar os filtros para encontrar os títulos desejados.
                            </p>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCtes.map((cte) => (
                  <TableRow key={cte.chaveCTe}>
                    <TableCell className="font-mono text-xs">
                      {cte.numero}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(cte.dhEmi), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {cte.emitNome}
                    </TableCell>
                    <TableCell>{cte.embarcador}</TableCell>
                    <TableCell>
                      <Badge variant={cte.subcontratacao.tipo === "CONTRATANTE" ? "destructive" : "default"}>
                        {cte.subcontratacao.tipo || "NORMAL"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(cte.vTPrest)}</TableCell>
                    <TableCell>
                      {cte.nfeChave ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cte.ciot.situacao === "Válido" ? "default" : cte.ciot.situacao === "Não aplicável" ? "secondary" : "destructive"}>
                        {cte.ciot.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cte.statusCompliance === "Conforme" ? "default" : "destructive"}>
                        {cte.statusCompliance}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cte.duplicidade.status === "Único" ? "default" : "destructive"}>
                        {cte.duplicidade.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{getSituacaoBadge(cte)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {getMotivoBloqueio(cte)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info("Detalhes do CTe (mock)")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          disabled={!isPagavel(cte)}
                          onClick={() => handleEnviarPagamento(cte)}
                        >
                          <Send className="h-4 w-4" />
                          Pagar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}