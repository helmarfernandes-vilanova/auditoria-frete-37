import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Eye, Check, FileText, Building2, Truck, MapPin, DollarSign, AlertTriangle } from "lucide-react";
import { CTe } from "@/data/mockData";
import { StatusBadge } from "./StatusBadge";
import { useAuditoria } from "@/contexts/AuditoriaContext";
import { toast } from "@/hooks/use-toast";

interface CTesTableProps {
  ctes: CTe[];
  onViewDetails: (cte: CTe) => void;
}

export function CTesTable({ ctes, onViewDetails }: CTesTableProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { marcarComoConferido, marcarLoteConferido } = useAuditoria();

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? ctes.map(cte => cte.chave) : []);
  };

  const handleSelectItem = (chave: string, checked: boolean) => {
    setSelectedItems(prev => 
      checked ? [...prev, chave] : prev.filter(id => id !== chave)
    );
  };

  const handleMarcarConferido = (chave: string) => {
    marcarComoConferido(chave);
    toast({
      title: "CT-e marcado como conferido",
      description: "CT-e foi marcado como conferido com sucesso."
    });
  };

  const handleMarcarLoteConferido = () => {
    marcarLoteConferido(selectedItems);
    setSelectedItems([]);
    toast({
      title: "Lote marcado como conferido",
      description: `${selectedItems.length} CT-es foram marcados como conferidos.`
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatChave = (chave: string) => {
    return `${chave.slice(0, 4)}...${chave.slice(-4)}`;
  };

  if (ctes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">Nenhum documento importado</p>
            <p className="text-muted-foreground">
              Clique em "📁 Importar Documentos" para carregar arquivos XML e visualizar os dados aqui.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm">{selectedItems.length} itens selecionados</span>
          <Button 
            size="sm" 
            onClick={handleMarcarLoteConferido}
            className="w-full sm:w-auto sm:ml-auto"
          >
            <Check className="h-3 w-3 mr-1" />
            Marcar como Conferido
          </Button>
        </div>
      )}

      <div className="border rounded-lg shadow-sm bg-card">
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-[1400px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-2 bg-muted/20">
                <TableHead className="w-12 sticky left-0 bg-muted/20 z-10 shadow-sm">
                  <Checkbox
                    checked={selectedItems.length === ctes.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[140px] sticky left-12 bg-muted/20 z-10 shadow-sm font-semibold text-base">
                  📄 Documento
                </TableHead>
                <TableHead className="min-w-[120px] font-semibold text-base">📅 Data</TableHead>
                <TableHead className="min-w-[180px] font-semibold text-base">
                  🚛 Transportadora
                </TableHead>
                <TableHead className="min-w-[100px] font-semibold text-base">
                  🏭 Origem
                </TableHead>
                <TableHead className="min-w-[120px] font-semibold text-base">💼 Tipo de Serviço</TableHead>
                <TableHead className="min-w-[160px] font-semibold text-base">
                  ⚖️ Compliance Legal/Fiscal
                </TableHead>
                <TableHead className="min-w-[150px] font-semibold text-base">
                  💰 Valores do Frete
                </TableHead>
                <TableHead className="min-w-[160px] font-semibold text-base">
                  ✅ Situação
                </TableHead>
                <TableHead className="min-w-[100px] sticky right-0 bg-muted/20 z-10 shadow-sm font-semibold text-base">⚡ Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ctes.map((cte) => (
                <TableRow key={cte.chave} className="hover:bg-blue-50 transition-all group border-b">
                  <TableCell className="sticky left-0 bg-background z-10 group-hover:bg-blue-50 transition-colors shadow-sm">
                    <Checkbox
                      checked={selectedItems.includes(cte.chave)}
                      onCheckedChange={(checked) => handleSelectItem(cte.chave, checked as boolean)}
                    />
                  </TableCell>
                  
                  {/* Documento */}
                  <TableCell className="sticky left-12 bg-background z-10 group-hover:bg-blue-50 transition-colors shadow-sm">
                    <div className="space-y-1">
                      <button
                        onClick={() => onViewDetails(cte)}
                        className="text-primary hover:underline font-mono text-sm font-medium block"
                      >
                        📄 CT-e {formatChave(cte.chave)}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        Nº {cte.numero} • Série {cte.serie}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Data */}
                  <TableCell>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        📅 {format(new Date(cte.emissao), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        🕐 {format(new Date(cte.emissao), "HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Transportadora */}
                  <TableCell>
                    <div className="space-y-2 p-2 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-900">
                        {cte.transportador}
                      </div>
                      <div className="text-xs text-muted-foreground border-t pt-1 mt-1">
                        📋 NF-e: {formatChave(cte.nfeChave)}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Origem */}
                  <TableCell>
                    <div className="p-2 bg-green-50 rounded-md text-center">
                      <div className="font-medium text-green-700">
                        🏭 <strong>CD {cte.origem}</strong>
                      </div>
                      <div className="text-xs text-green-600 mt-1">Centro de Distribuição</div>
                    </div>
                  </TableCell>
                  
                  {/* Tipo de Serviço */}
                  <TableCell className="text-center">
                    <div className="p-2 bg-purple-50 rounded-md">
                      {cte.subcontratacao.tipo === "EXECUTORA" ? (
                        <div>
                          <div className="text-purple-700 font-medium">🔧 EXECUTORA</div>
                          <div className="text-xs text-purple-600 mt-1">Quem faz o transporte</div>
                        </div>
                      ) : cte.subcontratacao.tipo === "CONTRATANTE" ? (
                        <div>
                          <div className="text-indigo-700 font-medium">📋 CONTRATANTE</div>
                          <div className="text-xs text-indigo-600 mt-1">Quem contrata terceiro</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-gray-700 font-medium">📦 NORMAL</div>
                          <div className="text-xs text-gray-600 mt-1">Serviço direto</div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Compliance Legal/Fiscal */}
                  <TableCell className="text-center">
                    <div className="p-2 rounded-md">
                      {!cte.subcontratacao.tipo ? (
                        // CT-e Normal
                        cte.icms.destacado ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                            <div className="text-green-700 font-medium text-sm">✅ Conforme CTe</div>
                            <div className="text-xs text-green-600 mt-1">ICMS destacado corretamente</div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                            <div className="text-red-700 font-medium text-sm">❌ Não Conforme</div>
                            <div className="text-xs text-red-600 mt-1">ICMS deve ser destacado</div>
                          </div>
                        )
                      ) : cte.subcontratacao.tipo === "EXECUTORA" ? (
                        // CT-e EXECUTORA
                        cte.icms.destacado ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                            <div className="text-green-700 font-medium text-sm">✅ Conforme CTe</div>
                            <div className="text-xs text-green-600 mt-1">EXECUTORA com ICMS</div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                            <div className="text-red-700 font-medium text-sm">❌ Não Conforme</div>
                            <div className="text-xs text-red-600 mt-1">EXECUTORA deve destacar ICMS</div>
                          </div>
                        )
                      ) : (
                        // CT-e CONTRATANTE
                        !cte.icms.destacado && cte.subcontratacao.referenciaCTeExecutora ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                            <div className="text-green-700 font-medium text-sm">✅ Conforme CTe</div>
                            <div className="text-xs text-green-600 mt-1">CONTRATANTE sem ICMS</div>
                          </div>
                        ) : !cte.subcontratacao.referenciaCTeExecutora ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                            <div className="text-yellow-700 font-medium text-sm">⏳ Pendente</div>
                            <div className="text-xs text-yellow-600 mt-1">Falta referência CT-e</div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                            <div className="text-red-700 font-medium text-sm">❌ Não Conforme</div>
                            <div className="text-xs text-red-600 mt-1">CONTRATANTE não deve destacar ICMS</div>
                          </div>
                        )
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Valores do Frete */}
                  <TableCell>
                    <div className="space-y-2 p-2 bg-emerald-50 rounded-md">
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-700">
                          {formatCurrency(cte.vTPrest)}
                        </div>
                        <div className="text-xs text-emerald-600">Valor do Frete</div>
                      </div>
                      
                      <div className="border-t pt-2">
                        <div className="text-sm text-gray-700 flex justify-between">
                          <span>ICMS:</span>
                          <span className="font-medium">{formatCurrency(cte.vICMS)}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Situação */}
                  <TableCell>
                    <div className="space-y-3 p-2">
                      {/* Status Principal */}
                      <div className="text-center">
                        {cte.statusCompliance === "Conforme" ? (
                          <div className="bg-green-100 border border-green-300 rounded-lg p-2">
                            <div className="text-green-700 font-medium text-sm">Aprovado</div>
                            <div className="text-xs text-green-600 mt-1">Documento aprovado</div>
                          </div>
                        ) : cte.statusCompliance === "Não conforme" ? (
                          <div className="bg-red-100 border border-red-300 rounded-lg p-2">
                            <div className="text-red-700 font-medium text-sm">❌ Tem problema</div>
                            <div className="text-xs text-red-600 mt-1">Precisa revisar</div>
                          </div>
                        ) : (
                          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2">
                            <div className="text-yellow-700 font-medium text-sm">⏳ Em análise</div>
                            <div className="text-xs text-yellow-600 mt-1">Aguardando verificação</div>
                          </div>
                        )}
                      </div>

                      {/* Situação de Duplicata */}
                      {cte.duplicidade.status === "Possível duplicado" && (
                        <div className="text-center">
                          <Badge className="bg-orange-100 text-orange-700 text-xs">
                            ⚠️ Possível Duplicata
                          </Badge>
                        </div>
                      )}

                      {/* Status de Pagamento */}
                      <div className="text-center">
                        {cte.pagavel ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            💳 PODE PAGAR
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 text-xs">
                            🚫 NÃO PAGAR
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {/* Ações */}
                  <TableCell className="sticky right-0 bg-background z-10 group-hover:bg-blue-50 transition-colors shadow-sm">
                    <div className="flex flex-col gap-2 min-w-[110px]">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(cte)}
                        className="w-full justify-start text-xs hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        👁️ Ver Detalhes
                      </Button>
                      
                      {!cte.conferido && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarcarConferido(cte.chave)}
                          className="w-full justify-start text-xs text-green-700 hover:bg-green-50 border-green-200"
                        >
                          <Check className="h-3 w-3 mr-2" />
                          ✅ Marcar OK
                        </Button>
                      )}
                      
                      {cte.pagavel && 
                       cte.duplicidade.status === "Único" && 
                       cte.statusCompliance === "Conforme" ? (
                        <Button
                          size="sm"
                          className="w-full justify-start text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            toast({
                              title: "Enviado para pagamento!",
                              description: "CT-e foi enviado para o financeiro.",
                            });
                          }}
                        >
                          <DollarSign className="h-3 w-3 mr-2" />
                          💳 Enviar Pagamento
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          className="w-full justify-start text-xs text-gray-500"
                          title={
                            !cte.pagavel 
                              ? "Este CT-e não deve ser pago" 
                              : cte.duplicidade.status !== "Único"
                              ? "CT-e tem duplicidade, não pode pagar"
                              : "CT-e tem problemas de compliance"
                          }
                        >
                          🚫 Bloqueado
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}