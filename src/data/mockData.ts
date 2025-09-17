export interface CTe {
  // Campos básicos do CT-e
  chaveCTe: string;
  chave: string; // mantido para compatibilidade
  serie: string;
  numero: string;
  dhEmi: string; // ISO format
  emissao: string; // mantido para compatibilidade
  
  // Emitente
  emitCNPJ: string;
  emitNome: string;
  
  // Partes envolvidas
  embarcador: string;
  transportador: string;
  nfeChave: string;
  origem: string;
  destino: string;
  tomador: "Embarcador" | "Transportador";
  
  // Valores
  vTPrest: number;
  vICMS: number;
  pICMS: number;
  vCarga: number;
  produtoPredominante: string;
  
  // ICMS
  icms: {
    valor: number;
    aliquota: number;
    destacado: boolean;
  };
  
  // Subcontratação
  subcontratacao: {
    tipo: "EXECUTORA" | "CONTRATANTE" | null;
    cnpjContratante: string | null;
    cnpjSubcontratada: string | null;
    referenciaCTeExecutora: string | null;
    referenciaCTeContratante: string | null;
  };
  
  // Compliance
  statusCompliance: "Conforme" | "Não conforme" | "Pendente";
  mensagemCompliance: string;
  pagavel: boolean;
  
  // Duplicidade
  duplicidade: {
    status: "Único" | "Possível duplicado" | "Par subcontratação";
    chaveRelacionada: string | null;
  };
  
  // Campos legados para compatibilidade
  financeiro: {
    vinculo: "Vinculado" | "Sem título" | "Pago";
    titulo: number;
    status: "Em aberto" | "Pago" | "—";
    vencimento: string | null;
    pagamento?: string;
  };
  comparacaoTabela: {
    esperado: number;
    delta: number;
    deltaPerc: number;
    status: "Conforme" | "Divergente";
  };
  ciot: {
    codigo: string | null;
    situacao: "Válido" | "Não aplicável" | "Ausente";
  };
  statusAuditoria: "Conforme" | "Divergente" | "Pendente";
  conferido?: boolean;
}

export interface TabelaFrete {
  transportador: string;
  embarcador: string;
  tipo: "Percentual sobre faturamento" | "Faixa de peso";
  regra: {
    percentual?: number;
    ateKg?: number;
    valor?: number;
    adicionalPorKm?: number;
    pedagio: number;
    vigenciaInicio: string;
    vigenciaFim: string;
  };
  status: "Ativa" | "Expirada";
}

export interface LogImportacao {
  id: string;
  dataHora: string;
  usuario: string;
  arquivos: number;
  ctesProcessados: number;
  ciotsReconhecidos: number;
  erros: number;
  detalhes: string;
}

export const embarcadores = ["Vila Nova", "Focomix", "V2 Farma"];
export const transportadoras = ["Transvila"];

// Constantes para regras de negócio
export const CNPJ_TRANSVILA = "12345678000123";

// Funções de compliance
export function calcularCompliance(cte: CTe): { statusCompliance: CTe["statusCompliance"]; mensagemCompliance: string; pagavel: boolean } {
  // Regra base (sem subcontratação)
  if (!cte.subcontratacao.tipo) {
    if (cte.icms.destacado) {
      return {
        statusCompliance: "Conforme",
        mensagemCompliance: "CT-e normal com ICMS destacado",
        pagavel: true
      };
    } else {
      return {
        statusCompliance: "Não conforme",
        mensagemCompliance: "Prestação normal sem ICMS destacado",
        pagavel: true
      };
    }
  }
  
  // Subcontratação - papel EXECUTORA
  if (cte.subcontratacao.tipo === "EXECUTORA") {
    if (cte.icms.destacado) {
      return {
        statusCompliance: "Conforme",
        mensagemCompliance: "CT-e EXECUTORA com ICMS destacado",
        pagavel: true
      };
    } else {
      return {
        statusCompliance: "Não conforme",
        mensagemCompliance: "CT-e EXECUTORA sem ICMS destacado",
        pagavel: true
      };
    }
  }
  
  // Subcontratação - papel CONTRATANTE
  if (cte.subcontratacao.tipo === "CONTRATANTE") {
    if (!cte.subcontratacao.referenciaCTeExecutora) {
      return {
        statusCompliance: "Pendente",
        mensagemCompliance: "Referenciar CT-e da executora",
        pagavel: false
      };
    }
    
    if (!cte.icms.destacado) {
      return {
        statusCompliance: "Conforme",
        mensagemCompliance: "CT-e CONTRATANTE sem destaque de ICMS",
        pagavel: false
      };
    } else {
      return {
        statusCompliance: "Não conforme",
        mensagemCompliance: "CT-e CONTRATANTE não deve destacar ICMS",
        pagavel: false
      };
    }
  }
  
  return {
    statusCompliance: "Pendente",
    mensagemCompliance: "Situação não identificada",
    pagavel: false
  };
}

export function detectarDuplicidade(ctes: CTe[]): CTe[] {
  const ctesProcessados = [...ctes];
  
  // Mapas para detecção
  const chaveMap = new Map<string, CTe[]>();
  const identityMap = new Map<string, CTe[]>();
  const contratoMap = new Map<string, CTe>();
  
  // Agrupar por chave e identidade
  ctesProcessados.forEach(cte => {
    // Por chave CT-e
    if (!chaveMap.has(cte.chaveCTe)) {
      chaveMap.set(cte.chaveCTe, []);
    }
    chaveMap.get(cte.chaveCTe)!.push(cte);
    
    // Por identidade (emitCNPJ, serie, numero, dhEmi±1d)
    const identity = `${cte.emitCNPJ}-${cte.serie}-${cte.numero}-${cte.dhEmi.split('T')[0]}`;
    if (!identityMap.has(identity)) {
      identityMap.set(identity, []);
    }
    identityMap.get(identity)!.push(cte);
    
    // Mapear CONTRATANTES para encontrar pares
    if (cte.subcontratacao.tipo === "CONTRATANTE") {
      contratoMap.set(cte.chaveCTe, cte);
    }
  });
  
  // Detectar duplicidades
  ctesProcessados.forEach(cte => {
    // Resetar status de duplicidade
    cte.duplicidade = { status: "Único", chaveRelacionada: null };
    
    // Chave duplicada
    const chaveDuplicatas = chaveMap.get(cte.chaveCTe) || [];
    if (chaveDuplicatas.length > 1) {
      cte.duplicidade.status = "Possível duplicado";
      cte.pagavel = false;
      return;
    }
    
    // Identidade duplicada
    const identity = `${cte.emitCNPJ}-${cte.serie}-${cte.numero}-${cte.dhEmi.split('T')[0]}`;
    const identityDuplicatas = identityMap.get(identity) || [];
    if (identityDuplicatas.length > 1) {
      cte.duplicidade.status = "Possível duplicado";
      cte.pagavel = false;
      return;
    }
    
    // Par de subcontratação
    if (cte.subcontratacao.tipo === "EXECUTORA" && cte.subcontratacao.cnpjContratante) {
      // Procurar CONTRATANTE correspondente
      const contratante = ctesProcessados.find(c => 
        c.subcontratacao.tipo === "CONTRATANTE" &&
        c.subcontratacao.referenciaCTeExecutora === cte.chaveCTe &&
        c.emitCNPJ === cte.subcontratacao.cnpjContratante
      );
      
      if (contratante) {
        cte.duplicidade.status = "Par subcontratação";
        cte.duplicidade.chaveRelacionada = contratante.chaveCTe;
        contratante.duplicidade.status = "Par subcontratação";
        contratante.duplicidade.chaveRelacionada = cte.chaveCTe;
      }
    }
  });
  
  return ctesProcessados;
}

export function matchSubTransvila(cte: CTe): boolean {
  const a = cte.subcontratacao?.tipo === "CONTRATANTE" && cte.emitCNPJ === CNPJ_TRANSVILA;
  const b = cte.subcontratacao?.tipo === "EXECUTORA" && cte.subcontratacao?.cnpjContratante === CNPJ_TRANSVILA;
  return a || b;
}

// Dados seed de teste
const baseCtes: Omit<CTe, 'statusCompliance' | 'mensagemCompliance' | 'pagavel' | 'duplicidade'>[] = [
  // CT-e EXECUTORA (subcontratada)
  {
    chaveCTe: "35250988888888888888570000011111678901234567",
    chave: "35250988888888888888570000011111678901234567",
    serie: "1",
    numero: "11111",
    dhEmi: "2025-09-01T09:20:00-03:00",
    emissao: "2025-09-01T09:20:00-03:00",
    emitCNPJ: "88888888000166",
    emitNome: "Rodovia Brasil Log S.A.",
    embarcador: "Vila Nova",
    transportador: "Rodovia Brasil Log S.A.",
    nfeChave: "35250988888888888888550000098765432100000001",
    origem: "10",
    destino: "Campinas/SP",
    tomador: "Embarcador",
    vTPrest: 1000.00,
    vICMS: 120.00,
    pICMS: 12.0,
    vCarga: 52000.00,
    produtoPredominante: "Mercearia",
    icms: {
      valor: 120.00,
      aliquota: 12,
      destacado: true
    },
    subcontratacao: {
      tipo: "EXECUTORA",
      cnpjContratante: CNPJ_TRANSVILA,
      cnpjSubcontratada: "88888888000166",
      referenciaCTeExecutora: null,
      referenciaCTeContratante: "35250912345678000123570000022222678901234568"
    },
    financeiro: { 
      vinculo: "Vinculado", 
      titulo: 1000.00, 
      status: "Em aberto", 
      vencimento: "2025-09-15" 
    },
    comparacaoTabela: { 
      esperado: 1000.00, 
      delta: 0.00, 
      deltaPerc: 0.00, 
      status: "Conforme" 
    },
    ciot: { 
      codigo: "CIOT-ABC12345", 
      situacao: "Válido" 
    },
    statusAuditoria: "Conforme"
  },
  
  // CT-e CONTRATANTE (Transvila)
  {
    chaveCTe: "35250912345678000123570000022222678901234568",
    chave: "35250912345678000123570000022222678901234568",
    serie: "1",
    numero: "22222",
    dhEmi: "2025-09-01T09:25:00-03:00",
    emissao: "2025-09-01T09:25:00-03:00",
    emitCNPJ: CNPJ_TRANSVILA,
    emitNome: "Transvila Transportes LTDA",
    embarcador: "Vila Nova",
    transportador: "Transvila Transportes LTDA",
    nfeChave: "35250988888888888888550000098765432100000001",
    origem: "10",
    destino: "Campinas/SP",
    tomador: "Embarcador",
    vTPrest: 1000.00,
    vICMS: 0.00,
    pICMS: 0.0,
    vCarga: 52000.00,
    produtoPredominante: "Mercearia",
    icms: {
      valor: 0.00,
      aliquota: 0,
      destacado: false
    },
    subcontratacao: {
      tipo: "CONTRATANTE",
      cnpjContratante: CNPJ_TRANSVILA,
      cnpjSubcontratada: "88888888000166",
      referenciaCTeExecutora: "35250988888888888888570000011111678901234567",
      referenciaCTeContratante: null
    },
    financeiro: { 
      vinculo: "Sem título", 
      titulo: 0, 
      status: "—", 
      vencimento: null 
    },
    comparacaoTabela: { 
      esperado: 1000.00, 
      delta: 0.00, 
      deltaPerc: 0.00, 
      status: "Conforme" 
    },
    ciot: { 
      codigo: null, 
      situacao: "Não aplicável" 
    },
    statusAuditoria: "Conforme"
  }
];

// Processar CT-es com compliance e duplicidade
const processedCtes = baseCtes.map(cte => {
  const compliance = calcularCompliance(cte as CTe);
  return {
    ...cte,
    ...compliance,
    duplicidade: { status: "Único" as const, chaveRelacionada: null }
  } as CTe;
});

export const mockCtes: CTe[] = detectarDuplicidade(processedCtes);

export const mockTabelasFrete: TabelaFrete[] = [
  {
    transportador: "Transvila",
    embarcador: "Vila Nova",
    tipo: "Percentual sobre faturamento",
    regra: { 
      percentual: 4.5, 
      pedagio: 80.0, 
      vigenciaInicio: "2025-07-01", 
      vigenciaFim: "2025-12-31" 
    },
    status: "Ativa"
  },
  {
    transportador: "Transvila",
    embarcador: "Focomix",
    tipo: "Faixa de peso",
    regra: { 
      ateKg: 10000, 
      valor: 1800.0, 
      adicionalPorKm: 0.0, 
      pedagio: 0,
      vigenciaInicio: "2025-06-01", 
      vigenciaFim: "2025-12-31" 
    },
    status: "Ativa"
  },
  {
    transportador: "Transvila",
    embarcador: "V2 Farma",
    tipo: "Percentual sobre faturamento",
    regra: { 
      percentual: 3.9, 
      pedagio: 60.0, 
      vigenciaInicio: "2025-05-01", 
      vigenciaFim: "2025-11-30" 
    },
    status: "Ativa"
  }
];

export const mockLogsImportacao: LogImportacao[] = [
  {
    id: "1",
    dataHora: "2025-09-08T10:30:00-03:00",
    usuario: "admin@vilanova.com.br",
    arquivos: 15,
    ctesProcessados: 12,
    ciotsReconhecidos: 8,
    erros: 3,
    detalhes: "3 arquivos com formato inválido ignorados"
  },
  {
    id: "2", 
    dataHora: "2025-09-07T14:15:00-03:00",
    usuario: "auditoria@vilanova.com.br",
    arquivos: 8,
    ctesProcessados: 8,
    ciotsReconhecidos: 5,
    erros: 0,
    detalhes: "Processamento realizado com sucesso"
  }
];

// ============= NFe Embarcador =============

export interface NFe {
  numero: string;
  data: string;
  embarcador: string;
  destinatario: string;
  valorMercadoria: number;
  status: 'Vinculada' | 'Aguardando';
  cteVinculado?: string;
}

export const mockNFes: NFe[] = [
  {
    numero: "0001",
    data: "2025-09-01",
    embarcador: "Vila Nova",
    destinatario: "Cliente Campinas",
    valorMercadoria: 25000,
    status: "Vinculada",
    cteVinculado: "CTe 4567"
  },
  {
    numero: "0002", 
    data: "2025-09-01",
    embarcador: "Focomix",
    destinatario: "Cliente Sorocaba",
    valorMercadoria: 18000,
    status: "Aguardando"
  },
  {
    numero: "0003",
    data: "2025-09-02",
    embarcador: "Vila Nova", 
    destinatario: "Cliente Santos",
    valorMercadoria: 32000,
    status: "Vinculada",
    cteVinculado: "CTe 7890"
  },
  {
    numero: "0004",
    data: "2025-09-03",
    embarcador: "Focomix",
    destinatario: "Cliente Ribeirão",
    valorMercadoria: 15000,
    status: "Aguardando"
  },
  {
    numero: "0005",
    data: "2025-09-03", 
    embarcador: "Vila Nova",
    destinatario: "Cliente ABC",
    valorMercadoria: 28000,
    status: "Vinculada",
    cteVinculado: "CTe 1234"
  },
  {
    numero: "0006",
    data: "2025-09-04",
    embarcador: "V2 Farma",
    destinatario: "Farmácia Central",
    valorMercadoria: 45000,
    status: "Aguardando"
  },
  {
    numero: "0007",
    data: "2025-09-05",
    embarcador: "Vila Nova",
    destinatario: "Cliente XYZ",
    valorMercadoria: 22000,
    status: "Vinculada", 
    cteVinculado: "CTe 5678"
  },
  {
    numero: "0008",
    data: "2025-09-06",
    embarcador: "Focomix",
    destinatario: "Cliente DEF",
    valorMercadoria: 37000,
    status: "Aguardando"
  }
];

// ============= CTe Recebidos =============

export interface CTeRecebido {
  numero: string;
  data: string;
  transportadora: string;
  tipoServico: 'EXECUTORA' | 'NORMAL' | 'SUBCONTRATACAO';
  valorFrete: number;
  icms: number;
  nfeVinculada?: string;
  compliance: 'Conforme' | 'Não Conforme';
  situacao: 'Pode Pagar' | 'Bloqueado';
  motivo?: string;
}

export const mockCTesRecebidos: CTeRecebido[] = [
  {
    numero: "4567",
    data: "2025-09-01",
    transportadora: "Rodovia Brasil Log",
    tipoServico: "EXECUTORA",
    valorFrete: 1000,
    icms: 120,
    nfeVinculada: "NF 0001",
    compliance: "Conforme",
    situacao: "Pode Pagar"
  },
  {
    numero: "9999",
    data: "2025-09-02",
    transportadora: "Transp. Independente",
    tipoServico: "NORMAL",
    valorFrete: 800,
    icms: 96,
    compliance: "Não Conforme",
    situacao: "Bloqueado",
    motivo: "Sem NF-e vinculada"
  },
  {
    numero: "7890",
    data: "2025-09-02",
    transportadora: "Logística Santos",
    tipoServico: "EXECUTORA",
    valorFrete: 1200,
    icms: 144,
    nfeVinculada: "NF 0003",
    compliance: "Conforme",
    situacao: "Pode Pagar"
  },
  {
    numero: "1234",
    data: "2025-09-03",
    transportadora: "TransVila",
    tipoServico: "SUBCONTRATACAO",
    valorFrete: 850,
    icms: 102,
    nfeVinculada: "NF 0005",
    compliance: "Conforme",
    situacao: "Pode Pagar"
  },
  {
    numero: "5678",
    data: "2025-09-05",
    transportadora: "Carga Expressa",
    tipoServico: "NORMAL",
    valorFrete: 950,
    icms: 114,
    nfeVinculada: "NF 0007",
    compliance: "Conforme",
    situacao: "Pode Pagar"
  },
  {
    numero: "1111",
    data: "2025-09-04",
    transportadora: "Frete Rápido",
    tipoServico: "NORMAL",
    valorFrete: 750,
    icms: 90,
    compliance: "Não Conforme",
    situacao: "Bloqueado",
    motivo: "Sem NF-e vinculada"
  },
  {
    numero: "2222",
    data: "2025-09-06",
    transportadora: "Super Transportes",
    tipoServico: "EXECUTORA", 
    valorFrete: 1100,
    icms: 132,
    compliance: "Não Conforme",
    situacao: "Bloqueado",
    motivo: "Documento irregular"
  },
  {
    numero: "3333",
    data: "2025-09-07",
    transportadora: "Mega Cargas",
    tipoServico: "NORMAL",
    valorFrete: 650,
    icms: 78,
    compliance: "Não Conforme", 
    situacao: "Bloqueado",
    motivo: "Sem NF-e vinculada"
  }
];

// ============= Fretistas Urbano =============

export interface DocTransporte {
  tipo: 'NFS-e';
  chave: string;
  issAliquota: number;
  issValor: number;
}

export interface CargaFretista {
  idCarga: string;
  nfeChave: string;
  dataNFe: string;
  embarcador: string;
  fretista: string;
  municipioUF: string;
  statusCarga: 'Em coleta' | 'Em trânsito' | 'Entregue' | 'Aguardando NFS-e';
  docTransporte?: DocTransporte;
  valorFrete: number;
  compliance: 'Conforme' | 'Não conforme' | 'Pendente';
  situacao: 'Pode pagar' | 'Não pagar';
  observacoes?: string;
}

export const mockFretistas: CargaFretista[] = [
  {
    idCarga: "FR-0001",
    nfeChave: "35250944444444000166550000022222678900000002",
    dataNFe: "2025-09-01",
    embarcador: "Focomix",
    fretista: "Fretista Centro SP Serviços LTDA",
    municipioUF: "São Paulo/SP",
    statusCarga: "Entregue",
    docTransporte: {
      tipo: "NFS-e",
      chave: "NFS-e-31062025-000123",
      issAliquota: 5.0,
      issValor: 11.00
    },
    valorFrete: 220.00,
    compliance: "Conforme",
    situacao: "Pode pagar"
  },
  {
    idCarga: "FR-0002",
    nfeChave: "35250977777777000123550000033333678900000003",
    dataNFe: "2025-09-02",
    embarcador: "Vila Nova",
    fretista: "Fretista Bairro Norte ME",
    municipioUF: "Belo Horizonte/MG",
    statusCarga: "Aguardando NFS-e",
    valorFrete: 180.00,
    compliance: "Não conforme",
    situacao: "Não pagar",
    observacoes: "Sem NFS-e vinculada"
  },
  {
    idCarga: "FR-0003",
    nfeChave: "35250922222222000111550000044444678900000004",
    dataNFe: "2025-09-03",
    embarcador: "V2 Farma",
    fretista: "Fretista Zona Leste EPP",
    municipioUF: "São Paulo/SP",
    statusCarga: "Em trânsito",
    docTransporte: {
      tipo: "NFS-e",
      chave: "NFS-e-3550308-000567",
      issAliquota: 0.0,
      issValor: 0.00
    },
    valorFrete: 150.00,
    compliance: "Não conforme",
    situacao: "Não pagar",
    observacoes: "ISS = R$ 0,00 (inadequado para transporte urbano)"
  },
  {
    idCarga: "FR-0004",
    nfeChave: "35250955555555000188550000055555678900000005",
    dataNFe: "2025-09-04",
    embarcador: "Vila Nova",
    fretista: "Express Urbano EIRELI",
    municipioUF: "São Paulo/SP",
    statusCarga: "Entregue",
    docTransporte: {
      tipo: "NFS-e",
      chave: "NFS-e-3550308-000789",
      issAliquota: 3.5,
      issValor: 7.00
    },
    valorFrete: 200.00,
    compliance: "Conforme",
    situacao: "Pode pagar"
  },
  {
    idCarga: "FR-0005",
    nfeChave: "35250966666666000199550000066666678900000006",
    dataNFe: "2025-09-05",
    embarcador: "Focomix",
    fretista: "Delivery Fast LTDA",
    municipioUF: "Rio de Janeiro/RJ",
    statusCarga: "Em coleta",
    valorFrete: 175.00,
    compliance: "Pendente",
    situacao: "Não pagar",
    observacoes: "Aguardando coleta da carga"
  },
  {
    idCarga: "FR-0006",
    nfeChave: "35250988888888000177550000088888678900000008",
    dataNFe: "2025-09-06",
    embarcador: "V2 Farma",
    fretista: "Pharma Express ME",
    municipioUF: "Campinas/SP",
    statusCarga: "Entregue",
    docTransporte: {
      tipo: "NFS-e",
      chave: "NFS-e-3543402-001234",
      issAliquota: 4.0,
      issValor: 6.40
    },
    valorFrete: 160.00,
    compliance: "Pendente",
    situacao: "Não pagar",
    observacoes: "Verificar natureza intramunicipal - origem divergente"
  }
];