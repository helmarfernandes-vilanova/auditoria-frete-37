import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { type NFe } from "@/data/mockData";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function NFeEmbarcador() {
  const [nfes] = useState<NFe[]>([]);  // Array vazio - sem dados mockados  
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [embarcadorFilter, setEmbarcadorFilter] = useState<string>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filtros únicos para os selects
  const embarcadores = useMemo(() => {
    const uniqueEmbarcadores = Array.from(new Set(nfes.map(nfe => nfe.embarcador)));
    return uniqueEmbarcadores.sort();
  }, [nfes]);

  // Aplicar filtros
  const filteredNFes = useMemo(() => {
    return nfes.filter(nfe => {
      // Filtro por status
      if (statusFilter !== "todos" && nfe.status.toLowerCase() !== statusFilter) return false;
      
      // Filtro por embarcador
      if (embarcadorFilter !== "todos" && nfe.embarcador !== embarcadorFilter) return false;
      
      // Filtro por período
      if (dateRange?.from || dateRange?.to) {
        const nfeDate = startOfDay(parseISO(nfe.data));
        if (dateRange.from && isBefore(nfeDate, startOfDay(dateRange.from))) return false;
        if (dateRange.to && isAfter(nfeDate, endOfDay(dateRange.to))) return false;
      }
      
      return true;
    });
  }, [statusFilter, embarcadorFilter, dateRange, nfes]);

  // Cálculo dos KPIs
  const kpis = useMemo(() => {
    const total = filteredNFes.length;
    const vinculadas = filteredNFes.filter(nfe => nfe.status === "Vinculada").length;
    const aguardando = filteredNFes.filter(nfe => nfe.status === "Aguardando").length;
    const percentualCobertura = total > 0 ? Math.round((vinculadas / total) * 100) : 0;
    
    return { total, vinculadas, aguardando, percentualCobertura };
  }, [filteredNFes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: NFe['status']) => {
    if (status === 'Vinculada') {
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Vinculada</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Aguardando</Badge>;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">NF-e Embarcador</h1>
        <p className="text-muted-foreground mt-1">
          Controle de cobertura fiscal: quais NF-es emitidas já têm CTe vinculado
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de NF-es"
          value={kpis.total}
          icon={<FileText className="h-4 w-4 text-primary" />}
        />
        <KPICard
          title="Vinculadas"
          value={kpis.vinculadas}
          subtitle={`${kpis.total > 0 ? Math.round((kpis.vinculadas / kpis.total) * 100) : 0}% do total`}
          trend="up"
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        />
        <KPICard
          title="Aguardando CTe"
          value={kpis.aguardando}
          subtitle={`${kpis.total > 0 ? Math.round((kpis.aguardando / kpis.total) * 100) : 0}% do total`}
          trend={kpis.aguardando > 0 ? "down" : "neutral"}
          icon={<Clock className="h-4 w-4 text-yellow-600" />}
        />
        <KPICard
          title="% Cobertura NF↔CTe"
          value={`${kpis.percentualCobertura}%`}
          trend={kpis.percentualCobertura >= 80 ? "up" : kpis.percentualCobertura >= 60 ? "neutral" : "down"}
          icon={<AlertTriangle className={cn("h-4 w-4", kpis.percentualCobertura >= 80 ? "text-green-600" : kpis.percentualCobertura >= 60 ? "text-yellow-600" : "text-red-600")} />}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Filtro por período */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
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
                      "Selecionar período"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
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

            {/* Filtro por embarcador */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Embarcador</label>
              <Select value={embarcadorFilter} onValueChange={setEmbarcadorFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Embarcadores</SelectItem>
                  {embarcadores.map(embarcador => (
                    <SelectItem key={embarcador} value={embarcador}>{embarcador}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="vinculada">Vinculada</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão para limpar filtros */}
            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Limpar</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter("todos");
                  setEmbarcadorFilter("todos");
                  setDateRange(undefined);
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de NF-es */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de NF-es ({filteredNFes.length})</CardTitle>
          <CardDescription>
            NF-es emitidas e seu status de vinculação com CTe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NF-e</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Embarcador</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Valor Mercadoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CTe Vinculado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNFes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma NF-e encontrada com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNFes.map((nfe) => (
                    <TableRow key={nfe.numero} className="hover:bg-muted/50">
                      <TableCell className="font-medium">NF {nfe.numero}</TableCell>
                      <TableCell>{format(parseISO(nfe.data), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{nfe.embarcador}</TableCell>
                      <TableCell>{nfe.destinatario}</TableCell>
                      <TableCell>{formatCurrency(nfe.valorMercadoria)}</TableCell>
                      <TableCell>{getStatusBadge(nfe.status)}</TableCell>
                      <TableCell>{nfe.cteVinculado || "—"}</TableCell>
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