import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  CalendarIcon, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  DollarSign, 
  Eye,
  Truck,
  Upload,
  Download,
  RefreshCw,
  Check,
  X,
  Clock,
  MapPin
} from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { type CargaFretista } from "@/data/mockData";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Fretistas() {
  const [periodoFilter, setPeriodoFilter] = useState<string>("30");
  const [embarcadorFilter, setEmbarcadorFilter] = useState<string>("todos");
  const [fretistaFilter, setFretistaFilter] = useState<string>("todos");
  const [statusCargaFilter, setStatusCargaFilter] = useState<string>("todos");
  const [complianceFilter, setComplianceFilter] = useState<string>("todos");
  const [situacaoFilter, setSituacaoFilter] = useState<string>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCarga, setSelectedCarga] = useState<CargaFretista | null>(null);
  const [nfseModalOpen, setNfseModalOpen] = useState(false);
  const [nfseChave, setNfseChave] = useState("");
  const [issAliquota, setIssAliquota] = useState("");
  const [issValor, setIssValor] = useState("");
  const [cargaParaNfse, setCargaParaNfse] = useState<CargaFretista | null>(null);
  const [cargas, setCargas] = useState<CargaFretista[]>([]);  // Array vazio - sem dados mockados
  
  const { toast } = useToast();

  // Filtros únicos para os selects
  const embarcadores = useMemo(() => {
    const uniqueEmbarcadores = Array.from(new Set(cargas.map(carga => carga.embarcador)));
    return uniqueEmbarcadores.sort();
  }, [cargas]);

  const fretistas = useMemo(() => {
    const uniqueFretistas = Array.from(new Set(cargas.map(carga => carga.fretista)));
    return uniqueFretistas.sort();
  }, [cargas]);

  // Aplicar filtros
  const filteredCargas = useMemo(() => {
    let filtered = cargas;

    // Filtro por período pré-definido
    if (periodoFilter !== "personalizado") {
      const hoje = new Date();
      const diasAtras = parseInt(periodoFilter);
      const dataInicio = new Date(hoje.getTime() - diasAtras * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(carga => {
        const cargaDate = parseISO(carga.dataNFe);
        return isAfter(cargaDate, dataInicio) || cargaDate.toDateString() === dataInicio.toDateString();
      });
    }

    // Filtro por período personalizado
    if (periodoFilter === "personalizado" && (dateRange?.from || dateRange?.to)) {
      filtered = filtered.filter(carga => {
        const cargaDate = startOfDay(parseISO(carga.dataNFe));
        if (dateRange.from && isBefore(cargaDate, startOfDay(dateRange.from))) return false;
        if (dateRange.to && isAfter(cargaDate, endOfDay(dateRange.to))) return false;
        return true;
      });
    }

    // Outros filtros
    if (embarcadorFilter !== "todos") filtered = filtered.filter(carga => carga.embarcador === embarcadorFilter);
    if (fretistaFilter !== "todos") filtered = filtered.filter(carga => carga.fretista === fretistaFilter);
    if (statusCargaFilter !== "todos") filtered = filtered.filter(carga => carga.statusCarga === statusCargaFilter);
    if (complianceFilter !== "todos") filtered = filtered.filter(carga => carga.compliance.toLowerCase().replace(" ", "-") === complianceFilter);
    if (situacaoFilter !== "todos") filtered = filtered.filter(carga => carga.situacao.toLowerCase().replace(" ", "-") === situacaoFilter);

    return filtered;
  }, [cargas, periodoFilter, dateRange, embarcadorFilter, fretistaFilter, statusCargaFilter, complianceFilter, situacaoFilter]);

  // Cálculo dos KPIs
  const kpis = useMemo(() => {
    const total = filteredCargas.length;
    const comNfse = filteredCargas.filter(carga => carga.docTransporte).length;
    const semNfse = filteredCargas.filter(carga => !carga.docTransporte).length;
    const valorPotencial = filteredCargas.reduce((acc, carga) => acc + carga.valorFrete, 0);
    const valorBloqueado = filteredCargas.filter(carga => carga.situacao === "Não pagar").reduce((acc, carga) => acc + carga.valorFrete, 0);
    
    return { total, comNfse, semNfse, valorPotencial, valorBloqueado };
  }, [filteredCargas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusCargaBadge = (status: CargaFretista['statusCarga']) => {
    const variants = {
      'Em coleta': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'Em trânsito': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'Entregue': 'bg-green-100 text-green-800 hover:bg-green-200',
      'Aguardando NFS-e': 'bg-orange-100 text-orange-800 hover:bg-orange-200'
    };
    
    return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
  };

  const getComplianceBadge = (compliance: CargaFretista['compliance']) => {
    if (compliance === 'Conforme') {
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Conforme</Badge>;
    }
    if (compliance === 'Não conforme') {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">Não Conforme</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">Pendente</Badge>;
  };

  const getSituacaoBadge = (situacao: CargaFretista['situacao']) => {
    if (situacao === 'Pode pagar') {
      return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Pode Pagar</Badge>;
    }
    return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">Não Pagar</Badge>;
  };

  const marcarEntregue = (idCarga: string) => {
    setCargas(prev => prev.map(carga => 
      carga.idCarga === idCarga 
        ? { ...carga, statusCarga: 'Entregue' as const }
        : carga
    ));
    toast({ title: "Carga marcada como entregue", description: `Carga ${idCarga} atualizada com sucesso.` });
  };

  const verificarSituacao = (idCarga: string) => {
    setCargas(prev => prev.map(carga => {
      if (carga.idCarga === idCarga) {
        let novaCompliance: CargaFretista['compliance'] = 'Não conforme';
        let novaSituacao: CargaFretista['situacao'] = 'Não pagar';
        let observacoes = '';

        if (carga.docTransporte) {
          if (carga.docTransporte.issValor > 0) {
            novaCompliance = 'Conforme';
            novaSituacao = 'Pode pagar';
          } else {
            observacoes = 'ISS = R$ 0,00 (inadequado para transporte urbano)';
          }
        } else {
          observacoes = 'Sem NFS-e vinculada';
        }

        return { ...carga, compliance: novaCompliance, situacao: novaSituacao, observacoes };
      }
      return carga;
    }));
    toast({ title: "Situação verificada", description: `Compliance da carga ${idCarga} recalculada.` });
  };

  const anexarNfse = () => {
    if (!cargaParaNfse) return;

    const issValorNumerico = parseFloat(issValor) || 0;
    const issAliquotaNumerico = parseFloat(issAliquota) || 0;

    setCargas(prev => prev.map(carga => {
      if (carga.idCarga === cargaParaNfse.idCarga) {
        const novoDocTransporte = {
          tipo: 'NFS-e' as const,
          chave: nfseChave,
          issAliquota: issAliquotaNumerico,
          issValor: issValorNumerico
        };

        const novaCompliance: CargaFretista['compliance'] = issValorNumerico > 0 ? 'Conforme' : 'Não conforme';
        const novaSituacao: CargaFretista['situacao'] = issValorNumerico > 0 ? 'Pode pagar' : 'Não pagar';

        return {
          ...carga,
          docTransporte: novoDocTransporte,
          compliance: novaCompliance,
          situacao: novaSituacao,
          observacoes: issValorNumerico > 0 ? undefined : 'ISS = R$ 0,00 (inadequado para transporte urbano)'
        };
      }
      return carga;
    }));

    setNfseModalOpen(false);
    setCargaParaNfse(null);
    setNfseChave("");
    setIssAliquota("");
    setIssValor("");
    
    toast({ 
      title: "NFS-e anexada", 
      description: `NFS-e vinculada à carga ${cargaParaNfse.idCarga} com sucesso.` 
    });
  };

  const exportarCSV = () => {
    const csvData = filteredCargas.map(carga => ({
      'ID Carga': carga.idCarga,
      'NF-e': carga.nfeChave.substring(25, 34),
      'Data NF-e': format(parseISO(carga.dataNFe), "dd/MM/yyyy"),
      'Embarcador': carga.embarcador,
      'Fretista': carga.fretista,
      'Município/UF': carga.municipioUF,
      'Status': carga.statusCarga,
      'Doc. Transporte': carga.docTransporte ? carga.docTransporte.chave : '—',
      'Valor Frete': formatCurrency(carga.valorFrete),
      'ISS': carga.docTransporte ? formatCurrency(carga.docTransporte.issValor) : '—',
      'Compliance': carga.compliance,
      'Situação': carga.situacao
    }));

    // Simular download CSV
    console.log('Exportando CSV:', csvData);
    toast({ title: "CSV exportado", description: `${csvData.length} registros exportados com sucesso.` });
  };

  const formatChaveNFe = (chave: string) => {
    return `${chave.substring(25, 34)}-${chave.substring(34, 37)}`;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fretistas Urbano/NFS-e</h1>
        <p className="text-muted-foreground mt-1">
          Auditoria de cargas em poder de fretistas urbanos (prestação intramunicipal via NFS-e/ISS)
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Cargas em Poder de Fretista"
          value={kpis.total}
          icon={<Truck className="h-4 w-4 text-primary" />}
        />
        <KPICard
          title="Cargas com NFS-e"
          value={kpis.comNfse}
          subtitle={`${kpis.total > 0 ? Math.round((kpis.comNfse / kpis.total) * 100) : 0}% do total`}
          trend="up"
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        />
        <KPICard
          title="Cargas sem NFS-e"
          value={kpis.semNfse}
          subtitle={`${kpis.total > 0 ? Math.round((kpis.semNfse / kpis.total) * 100) : 0}% do total`}
          trend={kpis.semNfse > 0 ? "down" : "neutral"}
          icon={<XCircle className="h-4 w-4 text-red-600" />}
        />
        <KPICard
          title="Valor Potencial de Frete"
          value={formatCurrency(kpis.valorPotencial)}
          icon={<DollarSign className="h-4 w-4 text-primary" />}
        />
        <KPICard
          title="Valor Bloqueado"
          value={formatCurrency(kpis.valorBloqueado)}
          subtitle={`${kpis.valorPotencial > 0 ? Math.round((kpis.valorBloqueado / kpis.valorPotencial) * 100) : 0}% do potencial`}
          trend={kpis.valorBloqueado > 0 ? "down" : "neutral"}
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
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
              <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período personalizado */}
            {periodoFilter === "personalizado" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Personalizada</label>
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
            )}

            {/* Filtro por embarcador */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa (Embarcador)</label>
              <Select value={embarcadorFilter} onValueChange={setEmbarcadorFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {embarcadores.map(embarcador => (
                    <SelectItem key={embarcador} value={embarcador}>{embarcador}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por fretista */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fretista</label>
              <Select value={fretistaFilter} onValueChange={setFretistaFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Fretistas</SelectItem>
                  {fretistas.map(fretista => (
                    <SelectItem key={fretista} value={fretista}>{fretista}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por status da carga */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status da Carga</label>
              <Select value={statusCargaFilter} onValueChange={setStatusCargaFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Em coleta">Em coleta</SelectItem>
                  <SelectItem value="Em trânsito">Em trânsito</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                  <SelectItem value="Aguardando NFS-e">Aguardando NFS-e</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por compliance */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Compliance</label>
              <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="conforme">Conforme</SelectItem>
                  <SelectItem value="não-conforme">Não conforme</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por situação financeira */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Situação Financeira</label>
              <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="pode-pagar">Pode pagar</SelectItem>
                  <SelectItem value="não-pagar">Não pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setPeriodoFilter("30");
                setEmbarcadorFilter("todos");
                setFretistaFilter("todos");
                setStatusCargaFilter("todos");
                setComplianceFilter("todos");
                setSituacaoFilter("todos");
                setDateRange(undefined);
              }}
            >
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Cargas */}
      <Card>
        <CardHeader>
          <CardTitle>Cargas com Fretista ({filteredCargas.length})</CardTitle>
          <CardDescription>
            Cargas urbanas sob responsabilidade de fretistas e status dos documentos de transporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carga</TableHead>
                  <TableHead>NF-e</TableHead>
                  <TableHead>Data NF-e</TableHead>
                  <TableHead>Embarcador</TableHead>
                  <TableHead>Fretista</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Status da Carga</TableHead>
                  <TableHead>Doc. Transporte</TableHead>
                  <TableHead>Valor Frete</TableHead>
                  <TableHead>ISS</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCargas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      {cargas.length === 0 ? (
                        <div className="flex flex-col items-center gap-4">
                          <Truck className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <p className="text-lg font-medium">Nenhuma carga de fretista</p>
                            <p className="text-sm text-muted-foreground">
                              Esta funcionalidade será integrada com a importação de documentos NFS-e.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <AlertCircle className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <p className="text-lg font-medium">Nenhuma carga encontrada</p>
                            <p className="text-sm text-muted-foreground">
                              Tente ajustar os filtros para encontrar as cargas desejadas.
                            </p>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCargas.map((carga) => (
                    <TableRow key={carga.idCarga} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{carga.idCarga}</TableCell>
                      <TableCell className="font-mono text-sm">{formatChaveNFe(carga.nfeChave)}</TableCell>
                      <TableCell>{format(parseISO(carga.dataNFe), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{carga.embarcador}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{carga.fretista}</TableCell>
                      <TableCell>{carga.municipioUF}</TableCell>
                      <TableCell>{getStatusCargaBadge(carga.statusCarga)}</TableCell>
                      <TableCell>
                        {carga.docTransporte ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">NFS-e</Badge>
                            <div className="text-xs font-mono">{carga.docTransporte.chave}</div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(carga.valorFrete)}</TableCell>
                      <TableCell>
                        {carga.docTransporte ? formatCurrency(carga.docTransporte.issValor) : "—"}
                      </TableCell>
                      <TableCell>{getComplianceBadge(carga.compliance)}</TableCell>
                      <TableCell>{getSituacaoBadge(carga.situacao)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Drawer>
                            <DrawerTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedCarga(carga)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent className="max-w-4xl mx-auto">
                              <DrawerHeader>
                                <DrawerTitle>Detalhes da Carga {carga.idCarga}</DrawerTitle>
                                <DrawerDescription>
                                  Informações completas e linha do tempo da carga
                                </DrawerDescription>
                              </DrawerHeader>
                              <div className="p-6 space-y-6">
                                {/* Resumo */}
                                <div>
                                  <h4 className="font-semibold mb-3">Resumo</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">NF-e</p>
                                      <p className="font-mono">{formatChaveNFe(carga.nfeChave)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Embarcador</p>
                                      <p>{carga.embarcador}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Fretista</p>
                                      <p>{carga.fretista}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Cidade/UF</p>
                                      <p>{carga.municipioUF}</p>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Financeiro */}
                                <div>
                                  <h4 className="font-semibold mb-3">Financeiro</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Valor do Frete</p>
                                      <p className="text-lg font-semibold">{formatCurrency(carga.valorFrete)}</p>
                                    </div>
                                    {carga.docTransporte && (
                                      <>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Alíquota ISS</p>
                                          <p>{carga.docTransporte.issAliquota}%</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Valor ISS</p>
                                          <p>{formatCurrency(carga.docTransporte.issValor)}</p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <Separator />

                                {/* Documentos */}
                                <div>
                                  <h4 className="font-semibold mb-3">Documentos</h4>
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-sm text-muted-foreground">NF-e</p>
                                      <p className="font-mono">{carga.nfeChave}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">NFS-e</p>
                                      {carga.docTransporte ? (
                                        <p className="font-mono">{carga.docTransporte.chave}</p>
                                      ) : (
                                        <p className="text-muted-foreground">Não informada</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Compliance */}
                                <div>
                                  <h4 className="font-semibold mb-3">Compliance (regras aplicadas)</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      {carga.docTransporte ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                                      <span className="text-sm">NFS-e vinculada</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {carga.docTransporte && carga.docTransporte.issValor > 0 ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                                      <span className="text-sm">ISS {'>'} R$ 0,00</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Check className="h-4 w-4 text-green-600" />
                                      <span className="text-sm">NF-e de origem vinculada</span>
                                    </div>
                                    {carga.observacoes && (
                                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="text-sm text-yellow-800">{carga.observacoes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <Separator />

                                {/* Linha do tempo */}
                                <div>
                                  <h4 className="font-semibold mb-3">Linha do Tempo</h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <div className="p-1 bg-blue-100 rounded-full">
                                        <FileText className="h-3 w-3 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Carga criada</p>
                                        <p className="text-xs text-muted-foreground">{format(parseISO(carga.dataNFe), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className={cn("p-1 rounded-full", carga.statusCarga !== 'Aguardando NFS-e' ? "bg-green-100" : "bg-gray-100")}>
                                        <Truck className={cn("h-3 w-3", carga.statusCarga !== 'Aguardando NFS-e' ? "text-green-600" : "text-gray-400")} />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Coleta realizada</p>
                                        <p className="text-xs text-muted-foreground">
                                          {carga.statusCarga !== 'Aguardando NFS-e' ? "Concluída" : "Pendente"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className={cn("p-1 rounded-full", carga.statusCarga === 'Entregue' ? "bg-green-100" : "bg-gray-100")}>
                                        <MapPin className={cn("h-3 w-3", carga.statusCarga === 'Entregue' ? "text-green-600" : "text-gray-400")} />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Entrega realizada</p>
                                        <p className="text-xs text-muted-foreground">
                                          {carga.statusCarga === 'Entregue' ? "Concluída" : "Pendente"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className={cn("p-1 rounded-full", carga.docTransporte ? "bg-green-100" : "bg-gray-100")}>
                                        <FileText className={cn("h-3 w-3", carga.docTransporte ? "text-green-600" : "text-gray-400")} />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">NFS-e recebida</p>
                                        <p className="text-xs text-muted-foreground">
                                          {carga.docTransporte ? "Recebida" : "Pendente"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DrawerContent>
                          </Drawer>

                          {carga.statusCarga !== 'Entregue' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => marcarEntregue(carga.idCarga)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}

                          {!carga.docTransporte && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setCargaParaNfse(carga);
                                setNfseModalOpen(true);
                              }}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}

                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => verificarSituacao(carga.idCarga)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>

                          {carga.situacao === 'Pode pagar' && (
                            <Button 
                              size="sm"
                              onClick={() => toast({ title: "Enviado para pagamento", description: `Carga ${carga.idCarga} enviada para processamento de pagamento.` })}
                            >
                              Enviar p/ Pagamento
                            </Button>
                          )}
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

      {/* Modal para anexar NFS-e */}
      <Dialog open={nfseModalOpen} onOpenChange={setNfseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anexar NFS-e</DialogTitle>
            <DialogDescription>
              Informe os dados da NFS-e para a carga {cargaParaNfse?.idCarga}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nfse-chave">Chave da NFS-e</Label>
              <Input
                id="nfse-chave"
                placeholder="Ex: NFS-e-3550308-001234"
                value={nfseChave}
                onChange={(e) => setNfseChave(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="iss-aliquota">Alíquota ISS (%)</Label>
                <Input
                  id="iss-aliquota"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 5.0"
                  value={issAliquota}
                  onChange={(e) => setIssAliquota(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="iss-valor">Valor ISS (R$)</Label>
                <Input
                  id="iss-valor"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 11.00"
                  value={issValor}
                  onChange={(e) => setIssValor(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNfseModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={anexarNfse}>
                Anexar NFS-e
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}