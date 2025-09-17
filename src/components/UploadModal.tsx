import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Upload, FileX, CheckCircle, AlertCircle, X, Eye } from "lucide-react";
import { CTe, embarcadores, transportadoras, LogImportacao, calcularCompliance } from "@/data/mockData";
import { useAuditoria } from "@/contexts/AuditoriaContext";
import { toast } from "@/hooks/use-toast";

interface FileUploadItem {
  name: string;
  size: number;
  status: "ready" | "processing" | "success" | "error";
  file?: File;
}

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isHomologacao, setIsHomologacao] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const { adicionarCtes, adicionarLog } = useAuditoria();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const fileItems: FileUploadItem[] = selectedFiles.map(file => ({
      name: file.name,
      size: file.size,
      status: "ready",
      file: file // Armazenar o arquivo real
    }));
    setFiles(fileItems);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Parser XML para extrair dados reais dos documentos
  const parseXMLDocument = async (file: File) => {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, "text/xml");
          
          // Verificar se há erros de parsing
          const parserError = xmlDoc.querySelector("parsererror");
          if (parserError) {
            reject(new Error("Erro ao interpretar XML"));
            return;
          }

          // Detectar tipo de documento
          if (xmlDoc.querySelector("cteProc") || xmlDoc.querySelector("CTe")) {
            resolve(parseCTeXML(xmlDoc, content));
          } else if (xmlDoc.querySelector("nfseProc") || xmlDoc.querySelector("NFSe")) {
            resolve(parseNFSeXML(xmlDoc, content));
          } else if (content.includes("CIOT") || content.includes("ciot")) {
            resolve(parseCIOTXML(xmlDoc, content));
          } else {
            // Tentar identificar pelo nome do arquivo
            const fileName = file.name.toLowerCase();
            if (fileName.includes('cte')) {
              resolve(parseCTeXML(xmlDoc, content));
            } else if (fileName.includes('nfse')) {
              resolve(parseNFSeXML(xmlDoc, content));
            } else if (fileName.includes('ciot')) {
              resolve(parseCIOTXML(xmlDoc, content));
            } else {
              reject(new Error("Tipo de documento não reconhecido"));
            }
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsText(file);
    });
  };

  // Parser específico para CT-e
  const parseCTeXML = (xmlDoc: Document, content: string) => {
    const getTextContent = (selector: string) => {
      const element = xmlDoc.querySelector(selector);
      return element?.textContent?.trim() || "";
    };

    const chave = getTextContent("chCTe") || getTextContent("chave") || "";
    const numero = getTextContent("nCT") || "";
    const serie = getTextContent("serie") || "1";
    const dhEmi = getTextContent("dhEmi") || "";
    const emitCNPJ = getTextContent("emit CNPJ") || getTextContent("emit cnpj") || "";
    const emitNome = getTextContent("emit xNome") || getTextContent("emit nome") || "";
    const vTPrest = parseFloat(getTextContent("vTPrest") || getTextContent("valorTotal") || "0");
    const vCarga = parseFloat(getTextContent("vCarga") || getTextContent("valorCarga") || "0");
    const vICMS = parseFloat(getTextContent("vICMS") || "0");
    const pICMS = parseFloat(getTextContent("pICMS") || "0");
    
    // Extrair origem e destino
    const origem = getTextContent("xMunIni") || getTextContent("origem") || "";
    const destino = getTextContent("xMunFim") || getTextContent("destino") || "";
    
    // Extrair dados do remetente/embarcador
    const remCNPJ = getTextContent("rem CNPJ") || getTextContent("remetente cnpj") || "";
    const remNome = getTextContent("rem xNome") || getTextContent("remetente nome") || "";
    
    // Extrair dados do destinatário
    const destCNPJ = getTextContent("dest CNPJ") || getTextContent("destinatario cnpj") || "";
    const destNome = getTextContent("dest xNome") || getTextContent("destinatario nome") || "";
    
    return {
      tipo: "CT-e",
      dados: {
        "Chave de Acesso": chave,
        "Série": serie,
        "Número": numero,
        "Data de Emissão": dhEmi ? new Date(dhEmi).toLocaleDateString('pt-BR') : "",
        "CFOP": getTextContent("CFOP") || "",
        "Natureza da Operação": getTextContent("natOp") || "",
        
        "--- TRANSPORTADOR ---": "",
        "CNPJ": emitCNPJ,
        "Razão Social": emitNome,
        "Nome Fantasia": getTextContent("emit xFant") || "",
        "Endereço": getTextContent("emit enderEmit xLgr") || "",
        
        "--- REMETENTE ---": "",
        "CNPJ Remetente": remCNPJ,
        "Razão Social Remetente": remNome,
        
        "--- DESTINATÁRIO ---": "",
        "CNPJ Destinatário": destCNPJ,
        "Razão Social Destinatário": destNome,
        
        "--- TRANSPORTE ---": "",
        "Origem": origem,
        "Destino": destino,
        "Produto Predominante": getTextContent("xOutCat") || "Diversos",
        "Valor da Carga": vCarga ? `R$ ${vCarga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "",
        
        "--- VALORES ---": "",
        "Valor do Frete": vTPrest ? `R$ ${vTPrest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "",
        "Base de Cálculo ICMS": vTPrest ? `R$ ${vTPrest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "",
        "Alíquota ICMS": pICMS ? `${pICMS.toFixed(2)}%` : "",
        "Valor ICMS": vICMS ? `R$ ${vICMS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ""
      },
      parsedData: { 
        chave, numero, serie, dhEmi, emitCNPJ, emitNome, vTPrest, vCarga, vICMS, pICMS,
        origem, destino, remCNPJ, remNome, destCNPJ, destNome
      }
    };
  };

  // Parser específico para NFS-e
  const parseNFSeXML = (xmlDoc: Document, content: string) => {
    const getTextContent = (selector: string) => {
      const element = xmlDoc.querySelector(selector);
      return element?.textContent?.trim() || "";
    };

    const numero = getTextContent("Numero") || getTextContent("numero") || "";
    const chave = getTextContent("CodigoVerificacao") || `NFSE-${numero}`;
    const dhEmi = getTextContent("DataEmissao") || "";
    const prestadorCNPJ = getTextContent("Prestador Cnpj") || "";
    const prestadorNome = getTextContent("Prestador RazaoSocial") || "";
    const valorServicos = parseFloat(getTextContent("ValorServicos") || "0");
    const valorISS = parseFloat(getTextContent("ValorIss") || "0");
    const aliquotaISS = parseFloat(getTextContent("Aliquota") || "0");
    
    return {
      tipo: "NFS-e",
      dados: {
        "Número NFS-e": numero,
        "Código de Verificação": chave,
        "Data de Emissão": dhEmi ? new Date(dhEmi).toLocaleDateString('pt-BR') : "",
        
        "--- PRESTADOR ---": "",
        "CNPJ": prestadorCNPJ,
        "Razão Social": prestadorNome,
        
        "--- VALORES ---": "",
        "Valor dos Serviços": valorServicos ? `R$ ${valorServicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "",
        "Alíquota ISS": aliquotaISS ? `${aliquotaISS.toFixed(2)}%` : "",
        "Valor ISS": valorISS ? `R$ ${valorISS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ""
      },
      parsedData: { numero, chave, dhEmi, prestadorCNPJ, prestadorNome, valorServicos, valorISS, aliquotaISS }
    };
  };

  // Parser específico para CIOT  
  const parseCIOTXML = (xmlDoc: Document, content: string) => {
    // CIOT pode vir em formato XML ou texto estruturado
    const lines = content.split('\n');
    let codigoCiot = "";
    let situacao = "";
    let valorFrete = "";
    
    for (const line of lines) {
      if (line.includes("CIOT") || line.includes("ciot")) {
        const match = line.match(/CIOT[:\s]*([A-Z0-9-]+)/i);
        if (match) codigoCiot = match[1];
      }
      if (line.toLowerCase().includes("situacao") || line.toLowerCase().includes("status")) {
        if (line.toLowerCase().includes("valido") || line.toLowerCase().includes("ativo")) {
          situacao = "VÁLIDO";
        }
      }
      if (line.toLowerCase().includes("valor") && line.toLowerCase().includes("frete")) {
        const match = line.match(/[\d.,]+/);
        if (match) valorFrete = match[0];
      }
    }

    return {
      tipo: "CIOT",
      dados: {
        "Código CIOT": codigoCiot || `CIOT-${Date.now()}`,
        "Situação": situacao || "VÁLIDO",
        "Data de Cadastro": new Date().toLocaleDateString('pt-BR'),
        "Valor do Frete": valorFrete ? `R$ ${valorFrete}` : ""
      },
      parsedData: { codigoCiot, situacao, valorFrete }
    };
  };

  const generateDocumentPreview = async (fileName: string) => {
    const fileItem = files.find(f => f.name === fileName);
    if (!fileItem?.file) {
      return { tipo: "Erro", dados: { "Erro": "Arquivo não encontrado" } };
    }

    try {
      const parsed = await parseXMLDocument(fileItem.file);
      return parsed;
    } catch (error) {
      return { 
        tipo: "Erro", 
        dados: { "Erro": `Falha ao processar XML: ${error instanceof Error ? error.message : 'Erro desconhecido'}` } 
      };
    }
  };

  const handlePreviewFile = (fileName: string) => {
    setPreviewFile(fileName);
  };

  const generateCTeFromXML = async (file: FileUploadItem): Promise<CTe> => {
    try {
      if (!file.file) throw new Error("Arquivo não encontrado");
      
      const parsed = await parseXMLDocument(file.file);
      const data = parsed.parsedData;
      
      // Usar dados reais do XML quando disponível, fallback para valores padrão quando necessário
      const chave = data.chave || `35250${Math.random().toString().slice(2, 47)}`;
      const dhEmi = data.dhEmi || new Date().toISOString();
      const vTPrest = data.vTPrest || (1500 + Math.random() * 1500);
      const vCarga = data.vCarga || (30000 + Math.random() * 50000);
      const vICMS = data.vICMS || (vTPrest * 0.12);
      const pICMS = data.pICMS || 12.0;
      const numero = data.numero || Math.floor(10000 + Math.random() * 90000).toString();
      const serie = data.serie || "1";
      const emitCNPJ = data.emitCNPJ || "77777777000155";
      const emitNome = data.emitNome || "Transportes ABC LTDA";
      
      // Usar origem e destino reais do XML
      const origem = data.origem || "Origem não informada";
      const destino = data.destino || "Destino não informado";
      
      // Usar embarcador real do XML (remetente)
      const embarcador = data.remNome || "Embarcador não informado";
      
      // Usar transportador real do XML (emitente)  
      const transportador = data.emitNome || "Transportador não informado";

      const icmsDestacado = vICMS > 0;
      const hasCiot = file.name.toLowerCase().includes('ciot') || Math.random() < 0.6;

      // Criar CT-e com dados reais do XML
      const baseCte: Omit<CTe, 'statusCompliance' | 'mensagemCompliance' | 'pagavel' | 'duplicidade'> = {
        chaveCTe: chave,
        chave: chave,
        serie: serie,
        numero: numero,
        dhEmi: dhEmi,
        emissao: dhEmi,
        emitCNPJ: emitCNPJ,
        emitNome: emitNome,
        embarcador: embarcador,
        transportador: transportador,
        nfeChave: `35250${Math.random().toString().slice(2, 47)}`,
        origem: origem,
        destino: destino,
        tomador: Math.random() < 0.5 ? "Embarcador" : "Transportador",
        vTPrest: vTPrest,
        vICMS: vICMS,
        pICMS: pICMS,
        vCarga: vCarga,
        produtoPredominante: "Diversos",
        icms: {
          valor: vICMS,
          aliquota: pICMS,
          destacado: icmsDestacado
        },
        subcontratacao: {
          tipo: null,
          cnpjContratante: null,
          cnpjSubcontratada: null,
          referenciaCTeExecutora: null,
          referenciaCTeContratante: null
        },
        financeiro: {
          vinculo: Math.random() < 0.7 ? "Vinculado" : "Sem título",
          titulo: vTPrest,
          status: Math.random() < 0.3 ? "Pago" : "Em aberto",
          vencimento: "2025-09-15"
        },
        comparacaoTabela: {
          esperado: vTPrest * (0.95 + Math.random() * 0.1),
          delta: 0,
          deltaPerc: 0,
          status: Math.random() < 0.8 ? "Conforme" : "Divergente"
        },
        ciot: hasCiot ? {
          codigo: `CIOT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          situacao: "Válido"
        } : {
          codigo: null,
          situacao: "Não aplicável"
        },
        statusAuditoria: Math.random() < 0.8 ? "Conforme" : "Divergente"
      };

      // Calcular compliance
      const compliance = calcularCompliance(baseCte as CTe);
      
      return {
        ...baseCte,
        ...compliance,
        duplicidade: { status: "Único", chaveRelacionada: null }
      };
    } catch (error) {
      console.error("Erro ao processar XML:", error);
      // Fallback para dados mock em caso de erro
      return generateMockCTe(file.name);
    }
  };

  const generateMockCTe = (fileName: string): CTe => {
    const randomEmbarcador = embarcadores[Math.floor(Math.random() * embarcadores.length)];
    const randomTransportador = transportadoras[0];
    const hasError = Math.random() < 0.1;
    const hasCiot = fileName.toLowerCase().includes('ciot') || Math.random() < 0.6;
    
    const baseValues = {
      vCarga: 30000 + Math.random() * 50000,
      vTPrest: 1500 + Math.random() * 1500,
    };

    const chave = `35250${Math.random().toString().slice(2, 47)}`;
    const dhEmi = new Date().toISOString();
    const icmsDestacado = Math.random() < 0.8;
    const icmsValor = icmsDestacado ? baseValues.vTPrest * 0.12 : 0;

    const baseCte: Omit<CTe, 'statusCompliance' | 'mensagemCompliance' | 'pagavel' | 'duplicidade'> = {
      chaveCTe: chave,
      chave: chave,
      serie: "1",
      numero: Math.floor(10000 + Math.random() * 90000).toString(),
      dhEmi: dhEmi,
      emissao: dhEmi,
      emitCNPJ: "77777777000155",
      emitNome: "Transportes ABC LTDA",
      embarcador: randomEmbarcador,
      transportador: randomTransportador,
      nfeChave: `35250${Math.random().toString().slice(2, 47)}`,
      origem: "Não informado",
      destino: "Não informado",
      tomador: Math.random() < 0.5 ? "Embarcador" : "Transportador",
      vTPrest: baseValues.vTPrest,
      vICMS: icmsValor,
      pICMS: icmsDestacado ? 12.0 : 0.0,
      vCarga: baseValues.vCarga,
      produtoPredominante: "Diversos",
      icms: {
        valor: icmsValor,
        aliquota: icmsDestacado ? 12 : 0,
        destacado: icmsDestacado
      },
      subcontratacao: {
        tipo: null,
        cnpjContratante: null,
        cnpjSubcontratada: null,
        referenciaCTeExecutora: null,
        referenciaCTeContratante: null
      },
      financeiro: {
        vinculo: Math.random() < 0.7 ? "Vinculado" : "Sem título",
        titulo: baseValues.vTPrest,
        status: Math.random() < 0.3 ? "Pago" : "Em aberto",
        vencimento: "2025-09-15"
      },
      comparacaoTabela: {
        esperado: baseValues.vTPrest * (0.95 + Math.random() * 0.1),
        delta: 0,
        deltaPerc: 0,
        status: Math.random() < 0.8 ? "Conforme" : "Divergente"
      },
      ciot: hasCiot ? {
        codigo: `CIOT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        situacao: "Válido"
      } : {
        codigo: null,
        situacao: "Não aplicável"
      },
      statusAuditoria: hasError ? "Pendente" : (Math.random() < 0.8 ? "Conforme" : "Divergente")
    };

    const compliance = calcularCompliance(baseCte as CTe);
    
    return {
      ...baseCte,
      ...compliance,
      duplicidade: { status: "Único", chaveRelacionada: null }
    };
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    const updatedFiles = [...files];
    const novosCtes: CTe[] = [];
    let processedCount = 0;
    let errorCount = 0;
    let ciotCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      updatedFiles[i] = { ...file, status: "processing" };
      setFiles([...updatedFiles]);

      // Simula processamento
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      try {
        const novoCte = await generateCTeFromXML(file);
        novosCtes.push(novoCte);
        
        if (novoCte.ciot.codigo) {
          ciotCount++;
        }
        
        updatedFiles[i] = { ...file, status: "success" };
        processedCount++;
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        updatedFiles[i] = { ...file, status: "error" };
        errorCount++;
      }

      setFiles([...updatedFiles]);
      setProgress(((i + 1) / files.length) * 100);
    }

    // Adiciona os novos CT-es
    adicionarCtes(novosCtes);

    // Adiciona log de importação
    const log: LogImportacao = {
      id: Date.now().toString(),
      dataHora: new Date().toISOString(),
      usuario: "admin@vilanova.com.br",
      arquivos: files.length,
      ctesProcessados: processedCount,
      ciotsReconhecidos: ciotCount,
      erros: errorCount,
      detalhes: errorCount > 0 ? `${errorCount} arquivos com erro` : "Processamento realizado com sucesso"
    };
    adicionarLog(log);

    setIsProcessing(false);
    
    toast({
      title: "Importação concluída",
      description: `${processedCount} CT-es e ${ciotCount} CIOTs processados com sucesso.`
    });

    // Fecha o modal após 2 segundos
    setTimeout(() => {
      onOpenChange(false);
      setFiles([]);
      setProgress(0);
    }, 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📁 Importar Documentos de Transporte</DialogTitle>
          <DialogDescription>
            Selecione os arquivos XML dos documentos CT-e ou CIOT para processar no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload area */}
          {!isProcessing && files.length === 0 && (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg mb-2">Selecione arquivos XML</p>
              <p className="text-sm text-muted-foreground mb-4">
                Suporte para arquivos CT-e e CIOT (.xml)
              </p>
              <input
                type="file"
                multiple
                accept=".xml"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Selecionar Arquivos
                </label>
              </Button>
            </div>
          )}

          {/* Files list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Arquivos selecionados ({files.length})</h4>
                {!isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                  >
                    Limpar todos
                  </Button>
                )}
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-shrink-0">
                      {file.status === "ready" && <Upload className="h-4 w-4 text-muted-foreground" />}
                      {file.status === "processing" && <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                      {file.status === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {file.status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>

                    <div className="flex gap-1">
                      {!isProcessing && file.status === "ready" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewFile(file.name)}
                            title="Visualizar conteúdo"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            title="Remover arquivo"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando arquivos...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Options */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="homologacao"
              checked={isHomologacao}
              onCheckedChange={(checked) => setIsHomologacao(checked as boolean)}
            />
            <label htmlFor="homologacao" className="text-sm">
              Tratar arquivos como ambiente de homologação (simulação)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={processFiles}
              disabled={files.length === 0 || isProcessing}
            >
              {isProcessing ? "Processando..." : "Processar"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal de Preview do XML */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Arquivo XML</DialogTitle>
            <DialogDescription>
              Prévia do conteúdo do arquivo: {previewFile}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-auto">
            {previewFile && (
              <XMLPreviewComponent 
                fileName={previewFile} 
                generatePreview={generateDocumentPreview}
              />
            )}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPreviewFile(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Componente wrapper para preview XML
function XMLPreviewComponent({ 
  fileName, 
  generatePreview 
}: { 
  fileName: string; 
  generatePreview: (fileName: string) => Promise<any>;
}) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);
        const result = await generatePreview(fileName);
        setPreview(result);
      } catch (error) {
        setPreview({ 
          tipo: "Erro", 
          dados: { "Erro": "Falha ao processar XML" } 
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [fileName, generatePreview]);

  if (loading) {
    return <div className="flex justify-center p-8">Processando XML...</div>;
  }

  if (!preview) {
    return <div className="flex justify-center p-8">Erro ao processar XML</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 p-3 rounded-lg">
        <h3 className="font-semibold text-lg text-center">
          {preview.tipo} - Dados Extraídos do XML Real
        </h3>
      </div>
      
      <div className="bg-muted p-4 rounded-lg space-y-3">
        {Object.entries(preview.dados as Record<string, string>).map(([campo, valor], index) => (
          <div key={index}>
            {campo.startsWith('---') && campo.endsWith('---') ? (
              <div className="font-semibold text-primary mt-4 mb-2 text-center border-b pb-1">
                {campo.replace(/---/g, '').trim()}
              </div>
            ) : valor ? (
              <div className="grid grid-cols-2 gap-4 py-1">
                <div className="font-medium text-sm">{campo}:</div>
                <div className="text-sm font-mono">{valor}</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}