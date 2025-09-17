import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Plus } from "lucide-react";
import { mockTabelasFrete, embarcadores } from "@/data/mockData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

export default function TabelasFrete() {
  const [embarcadorSelecionado, setEmbarcadorSelecionado] = useState<string>("todos");

  const handleImportarTabela = () => {
    toast({
      title: "Importar Tabela",
      description: "Funcionalidade de importação será implementada."
    });
  };

  const handleAdicionarRegra = () => {
    toast({
      title: "Adicionar Regra",
      description: "Funcionalidade de adição será implementada."
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const tabelasFiltradas = embarcadorSelecionado && embarcadorSelecionado !== "todos" 
    ? mockTabelasFrete.filter(tabela => tabela.embarcador === embarcadorSelecionado)
    : mockTabelasFrete;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tabelas de Frete</h1>
          <p className="text-muted-foreground">
            Gerenciamento das tabelas de frete contratadas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tabelas Contratadas - Transvila</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleImportarTabela}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Tabela (CSV)
              </Button>
              <Button onClick={handleAdicionarRegra}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Regra
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro por Embarcador */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Embarcador:</label>
            <Select value={embarcadorSelecionado} onValueChange={setEmbarcadorSelecionado}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os embarcadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os embarcadores</SelectItem>
                {embarcadores.map(embarcador => (
                  <SelectItem key={embarcador} value={embarcador}>
                    {embarcador}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Embarcador (NF-e)</TableHead>
                  <TableHead>Transportador</TableHead>
                  <TableHead>Tipo de Regra</TableHead>
                  <TableHead>Valor/Percentual</TableHead>
                  <TableHead>Pedágio</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabelasFiltradas.map((tabela, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{tabela.embarcador}</TableCell>
                    <TableCell>{tabela.transportador}</TableCell>
                    <TableCell>{tabela.tipo}</TableCell>
                    <TableCell>
                      {tabela.regra.percentual 
                        ? `${tabela.regra.percentual}% sobre faturamento`
                        : tabela.regra.valor 
                        ? `${formatCurrency(tabela.regra.valor)} até ${tabela.regra.ateKg}kg`
                        : "—"
                      }
                    </TableCell>
                    <TableCell>
                      {tabela.regra.pedagio > 0 ? formatCurrency(tabela.regra.pedagio) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(tabela.regra.vigenciaInicio), "dd/MM/yyyy", { locale: ptBR })}</div>
                        <div className="text-muted-foreground">
                          até {format(new Date(tabela.regra.vigenciaFim), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tabela.status === "Ativa" ? "default" : "secondary"}>
                        {tabela.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {tabelasFiltradas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma tabela de frete encontrada para os filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}