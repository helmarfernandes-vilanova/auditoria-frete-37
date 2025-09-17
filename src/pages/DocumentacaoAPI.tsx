import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, ExternalLink, Database, Code2, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentacaoAPI() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const CodeBlock = ({ children, title }: { children: string; title?: string }) => (
    <div className="relative">
      {title && (
        <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border-b">
          <span className="text-sm font-medium">{title}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(children)}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )}
      <pre className="bg-slate-950 text-slate-50 p-4 rounded-b-lg overflow-x-auto text-sm">
        <code>{children}</code>
      </pre>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Documentação da API</h1>
        <p className="text-muted-foreground mt-2">
          Especificações técnicas para integração com o sistema de Consultoria Delta
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="endpoints" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="service" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Service Layer
          </TabsTrigger>
          <TabsTrigger value="hooks" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            React Hooks
          </TabsTrigger>
          <TabsTrigger value="env" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Introdução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Esta documentação define a estrutura completa para integração do sistema de 
                Consultoria Delta com APIs reais, substituindo os dados mockados atuais.
              </p>
              
              <Alert>
                <AlertDescription>
                  <strong>Objetivo:</strong> Fornecer especificações técnicas detalhadas para 
                  desenvolvimento backend e integração frontend.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Funcionalidades Cobertas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <span>Configurações de regras</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <span>Dados de auditoria com filtros</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <span>Recálculo de regras</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <span>Exportação de relatórios</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <span>Detalhes de NF-e</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <span>Envio para pagamento</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tecnologias</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge>TypeScript</Badge>
                      <span>Tipagem forte</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>React Query</Badge>
                      <span>Cache e sincronização</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Fetch API</Badge>
                      <span>Requisições HTTP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>JSON</Badge>
                      <span>Formato de dados</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endpoints */}
        <TabsContent value="endpoints" className="space-y-6">
          <div className="space-y-6">
            {/* Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">GET</Badge>
                  /api/consultoria-delta/configuracoes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Buscar configurações das regras de cálculo</p>
                <CodeBlock title="Response JSON">
{`{
  "success": true,
  "data": {
    "regraTransvila": {
      "percentual": 3.3
    },
    "regraNikkey": {
      "percentual": 2.5,
      "minimo": 15.0,
      "limiteMinimoNF": 600.0
    },
    "tolerancia": {
      "percentual": 2.0
    }
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            {/* Auditorias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">GET</Badge>
                  /api/consultoria-delta/auditorias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Buscar dados de auditoria com filtros</p>
                
                <div>
                  <h4 className="font-semibold mb-2">Query Parameters:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><code>periodo</code>: "7dias" | "30dias" | "90dias"</div>
                    <div><code>status</code>: "todos" | "Conforme" | "Não conforme" | "Pendente"</div>
                    <div><code>pagavel</code>: "todos" | "sim" | "nao"</div>
                    <div><code>regra</code>: "todas" | "Mín. 15" | "2,5%"</div>
                  </div>
                </div>

                <CodeBlock title="Response JSON">
{`{
  "success": true,
  "data": {
    "linhas": [
      {
        "nfeChave": "352509QU0001",
        "emissao": "2025-09-09T00:00:00.000Z",
        "valorNF": 500.00,
        "perna1": {
          "papel": "CONTRATANTE",
          "transportadora": "Transvila",
          "esperado": 16.50,
          "cteValor": 16.50,
          "icms": "Destacado",
          "pagavel": true
        },
        "perna2": {
          "papel": "EXECUTORA",
          "transportadora": "Nikkey",
          "regraAplicada": "Mín. 15",
          "esperado": 15.00,
          "cteValor": 15.00,
          "icms": "Sem destaque",
          "pagavel": false
        },
        "delta": {
          "valor": 0.00,
          "perc": 0.00
        },
        "nfVinculadaExecutora": true,
        "compliance": "Conforme"
      }
    ],
    "total": 1,
    "totalPaginas": 1,
    "paginaAtual": 1
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            {/* Recalcular */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">POST</Badge>
                  /api/consultoria-delta/recalcular
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Recalcular regras para registros específicos</p>
                
                <CodeBlock title="Request JSON">
{`{
  "nfeChaves": ["352509QU0001", "352509QU0002"],
  "forcarRecalculo": true
}`}
                </CodeBlock>

                <CodeBlock title="Response JSON">
{`{
  "success": true,
  "message": "Regras recalculadas com sucesso",
  "data": {
    "processados": 2,
    "atualizados": 2,
    "erros": []
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            {/* Exportar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">POST</Badge>
                  /api/consultoria-delta/exportar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Gerar relatório CSV/Excel</p>
                
                <CodeBlock title="Request JSON">
{`{
  "formato": "csv",
  "filtros": {
    "periodo": "30dias",
    "status": "todos",
    "pagavel": "todos",
    "regra": "todas"
  },
  "campos": [
    "nfeChave",
    "emissao",
    "valorNF",
    "perna1.esperado",
    "perna1.cteValor",
    "compliance"
  ]
}`}
                </CodeBlock>

                <CodeBlock title="Response JSON">
{`{
  "success": true,
  "data": {
    "downloadUrl": "https://api.exemplo.com/downloads/consultoria-delta-2025-01-09.csv",
    "expires": "2025-01-09T18:00:00.000Z",
    "registros": 150
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            {/* Detalhes NF-e */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">GET</Badge>
                  /api/consultoria-delta/nfe/&#123;chave&#125;/detalhes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Buscar detalhes completos de uma NF-e específica</p>
                <CodeBlock title="Response JSON">
{`{
  "success": true,
  "data": {
    "nfe": {
      "chave": "352509QU0001",
      "numero": "1234",
      "serie": "1",
      "emissao": "2025-09-09T00:00:00.000Z",
      "valorTotal": 500.00,
      "emitente": {
        "cnpj": "12.345.678/0001-90",
        "razaoSocial": "Empresa Remetente Ltda"
      },
      "destinatario": {
        "cnpj": "98.765.432/0001-10",
        "razaoSocial": "Empresa Destinatário Ltda"
      }
    },
    "historico": [
      {
        "timestamp": "2025-09-09T10:30:00.000Z",
        "acao": "CALCULO_INICIAL",
        "usuario": "sistema",
        "detalhes": "Cálculo automático das regras"
      }
    ]
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            {/* Enviar Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">POST</Badge>
                  /api/consultoria-delta/enviar-pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Enviar registros conformes para o financeiro</p>
                
                <CodeBlock title="Request JSON">
{`{
  "nfeChaves": ["352509QU0001"],
  "observacoes": "Enviado após verificação manual"
}`}
                </CodeBlock>

                <CodeBlock title="Response JSON">
{`{
  "success": true,
  "message": "Registros enviados para pagamento",
  "data": {
    "enviados": 1,
    "protocoloFinanceiro": "PAG-2025-0109-001",
    "valorTotal": 16.50
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Modelos */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interfaces TypeScript</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock title="src/types/auditoria.ts">
{`interface LinhaAuditoria {
  nfeChave: string;
  emissao: string; // ISO date string
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
  regraNikkey: { 
    percentual: number; 
    minimo: number; 
    limiteMinimoNF: number 
  };
  tolerancia: { percentual: number };
}

interface FiltrosAuditoria {
  periodo: "7dias" | "30dias" | "90dias";
  status: "todos" | "Conforme" | "Não conforme" | "Pendente";
  pagavel: "todos" | "sim" | "nao";
  regra: "todas" | "Mín. 15" | "2,5%";
  dataInicio?: string;
  dataFim?: string;
}`}
              </CodeBlock>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estrutura de Erro Padrão</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock title="Error Response">
{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos fornecidos",
    "details": {
      "campo": "nfeChave",
      "erro": "Chave da NF-e é obrigatória"
    }
  }
}`}
              </CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Layer */}
        <TabsContent value="service" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Implementação do Service</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock title="src/services/consultoriaService.ts">
{`export class ConsultoriaService {
  private baseUrl = process.env.VITE_API_URL || '/api';

  async buscarConfiguracoes(): Promise<ConfiguracaoRegras> {
    const response = await fetch(\`\${this.baseUrl}/consultoria-delta/configuracoes\`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error.message);
    }
    
    return result.data;
  }

  async buscarAuditorias(filtros: FiltrosAuditoria): Promise<{
    linhas: LinhaAuditoria[];
    total: number;
  }> {
    const params = new URLSearchParams(filtros as any);
    const response = await fetch(\`\${this.baseUrl}/consultoria-delta/auditorias?\${params}\`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error.message);
    }
    
    return result.data;
  }

  async recalcularRegras(nfeChaves: string[]): Promise<void> {
    const response = await fetch(\`\${this.baseUrl}/consultoria-delta/recalcular\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nfeChaves, forcarRecalculo: true })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error.message);
    }
  }

  async exportarRelatorio(formato: 'csv' | 'excel', filtros: any): Promise<string> {
    const response = await fetch(\`\${this.baseUrl}/consultoria-delta/exportar\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formato, filtros })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error.message);
    }
    
    return result.data.downloadUrl;
  }

  async enviarPagamento(nfeChaves: string[], observacoes?: string): Promise<void> {
    const response = await fetch(\`\${this.baseUrl}/consultoria-delta/enviar-pagamento\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nfeChaves, observacoes })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error.message);
    }
  }
}`}
              </CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hooks */}
        <TabsContent value="hooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hook Personalizado para Integração</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock title="src/hooks/useConsultoriaDelta.ts">
{`import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConsultoriaService } from '@/services/consultoriaService';

export const useConsultoriaDelta = () => {
  const [dados, setDados] = useState<{
    configuracao: ConfiguracaoRegras | null;
    linhas: LinhaAuditoria[];
  }>({ configuracao: null, linhas: [] });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const service = new ConsultoriaService();

  const carregarDados = useCallback(async (filtros: FiltrosAuditoria) => {
    setLoading(true);
    try {
      const [configuracao, auditorias] = await Promise.all([
        service.buscarConfiguracoes(),
        service.buscarAuditorias(filtros)
      ]);
      
      setDados({
        configuracao,
        linhas: auditorias.linhas
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [service, toast]);

  const recalcularRegras = useCallback(async (nfeChaves: string[]) => {
    try {
      await service.recalcularRegras(nfeChaves);
      toast({
        title: "Sucesso",
        description: "Regras recalculadas com sucesso"
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro ao recalcular",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    }
  }, [service, toast]);

  const exportarRelatorio = useCallback(async (formato: 'csv' | 'excel', filtros: any) => {
    try {
      const downloadUrl = await service.exportarRelatorio(formato, filtros);
      window.open(downloadUrl, '_blank');
      toast({
        title: "Relatório gerado",
        description: "Download iniciado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  }, [service, toast]);

  return {
    dados,
    loading,
    carregarDados,
    recalcularRegras,
    exportarRelatorio
  };
};`}
              </CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuração */}
        <TabsContent value="env" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variáveis de Ambiente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock title=".env">
{`# URL base da API
VITE_API_URL=https://api.empresa.com

# Chave de autenticação da API
VITE_API_KEY=sua-chave-api-aqui

# Timeout para requisições (ms)
VITE_API_TIMEOUT=30000

# Ambiente de execução
VITE_ENV=production`}
              </CodeBlock>

              <Alert>
                <AlertDescription>
                  <strong>Importante:</strong> Nunca commite arquivos .env com dados sensíveis. 
                  Use .env.example para documentar as variáveis necessárias.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuração do Vite</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock title="vite.config.ts">
{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});`}
              </CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}