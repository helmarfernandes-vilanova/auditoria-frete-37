import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, CheckCircle, AlertCircle, XCircle, DollarSign } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuditoria } from "@/contexts/AuditoriaContext";
import { type CTe } from "@/data/mockData";

export default function CTeRecebidos() {
  const { ctes } = useAuditoria();  // Usar dados do contexto
  const [complianceFilter, setComplianceFilter] = useState<string>("todos");
  const [transportadoraFilter, setTransportadoraFilter] = useState<string>("todos");
  const [tipoServicoFilter, setTipoServicoFilter] = useState<string>("todos");
  const [situacaoFilter, setSituacaoFilter] = useState<string>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filtros únicos para os selects
  const transportadoras = useMemo(() => {
    const uniqueTransportadoras = Array.from(new Set(ctes.map(cte => cte.emitNome)));
    return uniqueTransportadoras.sort();
  }, [ctes]);

  const tiposServico = useMemo(() => {
    const uniqueTipos = Array.from(new Set(ctes.map(cte => cte.subcontratacao.tipo || "NORMAL")));
    return uniqueTipos.sort();
  }, [ctes]);

  // Aplicar filtros
  const filteredCTes = useMemo(() => {
    return ctes.filter(cte => {
      // Filtro por compliance
      if (complianceFilter !== "todos" && cte.statusCompliance.toLowerCase().replace(" ", "-") !== complianceFilter) return false;
      
      // Filtro por transportadora
      if (transportadoraFilter !== "todos" && cte.emitNome !== transportadoraFilter) return false;
      
      // Filtro por tipo de serviço
      const tipoServico = cte.subcontratacao.tipo || "NORMAL";
      if (tipoServicoFilter !== "todos" && tipoServico !== tipoServicoFilter) return false;
      
      // Filtro por situação
      const podePagar = cte.pagavel && cte.statusCompliance === "Conforme" && cte.duplicidade.status === "Único" && cte.nfeChave && cte.subcontratacao.tipo !== "CONTRATANTE";
      if (situacaoFilter === "pode-pagar" && !podePagar) return false;
      if (situacaoFilter === "bloqueado" && podePagar) return false;
      
      // Filtro por período
      if (dateRange?.from || dateRange?.to) {
        const cteDate = startOfDay(parseISO(cte.dhEmi));
        if (dateRange.from && isBefore(cteDate, startOfDay(dateRange.from))) return false;
        if (dateRange.to && isAfter(cteDate, endOfDay(dateRange.to))) return false;
      }
      
      return true;
    });
  }, [complianceFilter, transportadoraFilter, tipoServicoFilter, situacaoFilter, dateRange]);

  // Cálculo dos KPIs
  const kpis = useMemo(() => {
    const total = filteredCTes.length;
    const vinculados = filteredCTes.filter(cte => cte.nfeChave).length;
    const semNF = filteredCTes.filter(cte => !cte.nfeChave).length;
    const conformes = filteredCTes.filter(cte => cte.statusCompliance === "Conforme").length;
    const podesPagar = filteredCTes.filter(cte => {
      return cte.pagavel && cte.statusCompliance === "Conforme" && cte.duplicidade.status === "Único" && cte.nfeChave && cte.subcontratacao.tipo !== "CONTRATANTE";
    }).length;
    const bloqueados = total - podesPagar;
    
    const valorTotalAuditado = filteredCTes.reduce((acc, cte) => acc + cte.vTPrest, 0);
    const valorBloqueado = filteredCTes.filter(cte => {
      return !(cte.pagavel && cte.statusCompliance === "Conforme" && cte.duplicidade.status === "Único" && cte.nfeChave && cte.subcontratacao.tipo !== "CONTRATANTE");
    }).reduce((acc, cte) => acc + cte.vTPrest, 0);
    
    return { 
      total, 
      vinculados, 
      semNF, 
      conformes, 
      podesPagar, 
      bloqueados,
      valorTotalAuditado,
      valorBloqueado
    };
  }, [filteredCTes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getComplianceBadge = (compliance: CTe['statusCompliance']) => {
    if (compliance === 'Conforme') {
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Conforme</Badge>;
    }
    if (compliance === 'Não conforme') {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">Não Conforme</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendente</Badge>;
  };

  const getSituacaoBadge = (cte: CTe) => {
    const podePagar = cte.pagavel && cte.statusCompliance === "Conforme" && cte.duplicidade.status === "Único" && cte.nfeChave && cte.subcontratacao.tipo !== "CONTRATANTE";
    
    if (podePagar) {
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Pode Pagar</Badge>;
    }
    return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">Bloqueado</Badge>;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">CT-e Recebidos</h1>
        <p className="text-muted-foreground">
          De todos os CT-es que recebemos, quais estão vinculados a NF-e e podem ser pagos, e quais não têm NF-e correspondente?
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <KPICard
          title="Total CT-es"
          value={kpis.total}
          icon={<FileText className="h-4 w-4 text-primary" />}
        />
        <KPICard
          title="Vinculados a NF"
          value={kpis.vinculados}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        />
        <KPICard
          title="Sem NF-e"
          value={kpis.semNF}
          subtitle="Alerta"
          trend="down"
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
        />
        <KPICard
          title="Conformes"
          value={kpis.conformes}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        />
        <KPICard
          title="Valor Auditado"
          value={formatCurrency(kpis.valorTotalAuditado)}
          icon={<DollarSign className="h-4 w-4 text-primary" />}
        />
        <KPICard
          title="Valor Bloqueado"
          value={formatCurrency(kpis.valorBloqueado)}
          icon={<XCircle className="h-4 w-4 text-red-600" />}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

            {/* Transportadora */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Transportadora</label>
              <Select value={transportadoraFilter} onValueChange={setTransportadoraFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {transportadoras.map(transportadora => (
                    <SelectItem key={transportadora} value={transportadora}>{transportadora}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Serviço */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Serviço</label>
              <Select value={tipoServicoFilter} onValueChange={setTipoServicoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {tiposServico.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compliance */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Compliance</label>
              <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="conforme">Conforme</SelectItem>
                  <SelectItem value="não-conforme">Não conforme</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Situação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Situação Financeira</label>
              <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="pode-pagar">Pode pagar</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setComplianceFilter("todos");
              setTransportadoraFilter("todos");
              setTipoServicoFilter("todos");
              setSituacaoFilter("todos");
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
          <CardTitle>CT-es Recebidos</CardTitle>
          <CardDescription>
            {filteredCTes.length} CT-e{filteredCTes.length !== 1 ? 's' : ''} encontrado{filteredCTes.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CTe</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Tipo Serviço</TableHead>
                  <TableHead>Valor Frete</TableHead>
                  <TableHead>ICMS</TableHead>
                  <TableHead>NF-e</TableHead>
                  <TableHead>CIOT</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Duplicidade</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCTes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      {ctes.length === 0 ? (
                        <div className="flex flex-col items-center gap-4">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <p className="text-lg font-medium">Nenhum CT-e importado</p>
                            <p className="text-sm text-muted-foreground">
                              Vá para a página de Auditoria e importe arquivos XML para visualizar os dados aqui.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <AlertCircle className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                            <p className="text-sm text-muted-foreground">
                              Tente ajustar os filtros para encontrar os CT-es desejados.
                            </p>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCTes.map((cte) => (
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
                    <TableCell>
                      <Badge variant={cte.subcontratacao.tipo === "CONTRATANTE" ? "destructive" : "default"}>
                        {cte.subcontratacao.tipo || "NORMAL"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(cte.vTPrest)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {cte.icms.destacado ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        {formatCurrency(cte.icms.valor)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cte.nfeChave ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">Vinculada</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">Sem NF-e</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cte.ciot.situacao === "Válido" ? "default" : cte.ciot.situacao === "Não aplicável" ? "secondary" : "destructive"}>
                        {cte.ciot.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell>{getComplianceBadge(cte.statusCompliance)}</TableCell>
                    <TableCell>
                      <Badge variant={cte.duplicidade.status === "Único" ? "default" : "destructive"}>
                        {cte.duplicidade.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{getSituacaoBadge(cte)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {cte.mensagemCompliance}
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