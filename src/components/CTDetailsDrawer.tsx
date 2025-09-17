import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertTriangle, FileText, Building, Truck, CreditCard } from "lucide-react";
import { CTe } from "@/data/mockData";
import { StatusBadge } from "./StatusBadge";
import { useAuditoria } from "@/contexts/AuditoriaContext";
import { toast } from "@/hooks/use-toast";

interface CTDetailsDrawerProps {
  cte: CTe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CTDetailsDrawer({ cte, open, onOpenChange }: CTDetailsDrawerProps) {
  const { marcarComoConferido } = useAuditoria();

  if (!cte) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatChaveCompleta = (chave: string) => {
    return chave.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleMarcarConferido = () => {
    marcarComoConferido(cte.chave);
    toast({
      title: "CT-e marcado como conferido",
      description: "CT-e foi marcado como conferido com sucesso."
    });
    onOpenChange(false);
  };

  const handleReportarDivergencia = () => {
    toast({
      title: "Divergência reportada",
      description: "Divergência foi registrada para análise."
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-6xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do CT-e
            </DrawerTitle>
            <DrawerDescription className="font-mono text-xs">
              {formatChaveCompleta(cte.chave)}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resumo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Série/Número</p>
                      <p className="font-semibold">{cte.serie}/{cte.numero}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Emissão</p>
                      <p className="font-semibold">
                        {format(new Date(cte.emissao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Modalidade</p>
                    <p className="font-semibold">
                      {cte.subcontratacao?.tipo === "CONTRATANTE" ? "Subcontratação (Contratante)" : 
                       cte.subcontratacao?.tipo === "EXECUTORA" ? "Subcontratação (Executora)" : 
                       "Rodoviário"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Tomador</p>
                      <p className="font-semibold">{cte.tomador}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusBadge status={cte.statusAuditoria} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Valores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Frete Total (vTPrest)</p>
                      <p className="font-semibold text-lg">{formatCurrency(cte.vTPrest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor da Carga</p>
                      <p className="font-semibold">{formatCurrency(cte.vCarga)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">ICMS</p>
                      <p className="font-semibold">{formatCurrency(cte.vICMS)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">% ICMS</p>
                      <p className="font-semibold">{cte.pICMS}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Produto Predominante</p>
                    <p className="font-semibold">{cte.produtoPredominante}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Partes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Partes Envolvidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Embarcador</p>
                    <p className="font-semibold">{cte.embarcador}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transportador (Emitente)</p>
                    <p className="font-semibold">{cte.emitNome}</p>
                    <p className="text-xs text-muted-foreground font-mono">{cte.emitCNPJ}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Origem → Destino</p>
                    <p className="font-semibold">{cte.origem} → {cte.destino}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Documentos Relacionados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documentos Relacionados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">NF-e Vinculada</p>
                    {cte.nfeChave ? (
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{cte.nfeChave.slice(0, 4)}...{cte.nfeChave.slice(-4)}</p>
                        <Button size="sm" variant="outline" disabled>
                          Abrir NF-e
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma NF-e vinculada</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financeiro */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Situação Financeira</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Vínculo</p>
                      <StatusBadge status={cte.financeiro.vinculo} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor do Título</p>
                      <p className="font-semibold">{formatCurrency(cte.financeiro.titulo)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusBadge status={cte.financeiro.status} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vencimento</p>
                      <p className="font-semibold">
                        {cte.financeiro.vencimento 
                          ? format(new Date(cte.financeiro.vencimento), "dd/MM/yyyy", { locale: ptBR })
                          : "—"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subcontratação */}
              {(cte.subcontratacao?.tipo === "CONTRATANTE" || cte.subcontratacao?.tipo === "EXECUTORA") && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Subcontratação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo</p>
                        <Badge variant={cte.subcontratacao.tipo === "CONTRATANTE" ? "destructive" : "default"}>
                          {cte.subcontratacao.tipo}
                        </Badge>
                      </div>
                      {cte.subcontratacao.cnpjContratante && (
                        <div>
                          <p className="text-xs text-muted-foreground">CNPJ Contratante</p>
                          <p className="font-mono text-sm">{cte.subcontratacao.cnpjContratante}</p>
                        </div>
                      )}
                      {cte.subcontratacao.referenciaCTeExecutora && (
                        <div>
                          <p className="text-xs text-muted-foreground">CT-e Executora</p>
                          <p className="font-mono text-sm">{cte.subcontratacao.referenciaCTeExecutora}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Compliance */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Status de Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status Geral:</span>
                      <Badge variant={cte.statusCompliance === "Conforme" ? "default" : "destructive"}>
                        {cte.statusCompliance}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Duplicidade:</span>
                      <Badge variant={cte.duplicidade.status === "Único" ? "default" : "destructive"}>
                        {cte.duplicidade.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pode Pagar:</span>
                      <Badge variant={cte.pagavel ? "default" : "destructive"}>
                        {cte.pagavel ? "Sim" : "Não"}
                      </Badge>
                    </div>
                    {cte.mensagemCompliance && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">{cte.mensagemCompliance}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CIOT */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">CIOT</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Código CIOT</p>
                      <p className="font-semibold font-mono">
                        {cte.ciot.codigo || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Situação</p>
                      <Badge variant={cte.ciot.situacao === "Válido" ? "default" : "secondary"}>
                        {cte.ciot.situacao}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pagador</p>
                      <p className="font-semibold">{cte.embarcador}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between items-center p-6 pt-0">
            <div className="flex items-center gap-2">
              {cte.conferido && (
                <Badge variant="outline" className="text-green-700">
                  ✓ Conferido
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={handleReportarDivergencia}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reportar Divergência
              </Button>
              {!cte.conferido && (
                <Button onClick={handleMarcarConferido}>
                  <Check className="h-4 w-4 mr-2" />
                  Marcar como Conferido
                </Button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}