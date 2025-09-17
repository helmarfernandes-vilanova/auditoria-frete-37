import { createContext, useContext, useState, ReactNode } from "react";
import { CTe, mockCtes, LogImportacao, mockLogsImportacao, calcularCompliance, detectarDuplicidade } from "@/data/mockData";

interface Filters {
  periodo: "7dias" | "30dias" | "90dias" | "personalizado";
  embarcadores: string[];
  transportadoras: string[];
  statusAuditoria: string[];
  tomador: string[];
  subcontratacaoTransvila: "todos" | "sim" | "nao";
  dataInicio?: string;
  dataFim?: string;
}

interface AuditoriaContextType {
  ctes: CTe[];
  logs: LogImportacao[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  resetFilters: () => void;
  adicionarCtes: (novosCtes: CTe[]) => void;
  adicionarLog: (log: LogImportacao) => void;
  marcarComoConferido: (chave: string) => void;
  marcarLoteConferido: (chaves: string[]) => void;
  verificarCompliance: () => void;
}

const defaultFilters: Filters = {
  periodo: "30dias",
  embarcadores: [],
  transportadoras: [],
  statusAuditoria: [],
  tomador: [],
  subcontratacaoTransvila: "todos"
};

const AuditoriaContext = createContext<AuditoriaContextType | undefined>(undefined);

export function AuditoriaProvider({ children }: { children: ReactNode }) {
  const [ctes, setCtes] = useState<CTe[]>([]);  // Iniciar vazio - só dados importados
  const [logs, setLogs] = useState<LogImportacao[]>([]);  // Iniciar vazio - só logs reais
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const adicionarCtes = (novosCtes: CTe[]) => {
    setCtes(prev => [...novosCtes, ...prev]);
  };

  const adicionarLog = (log: LogImportacao) => {
    setLogs(prev => [log, ...prev]);
  };

  const marcarComoConferido = (chave: string) => {
    setCtes(prev => prev.map(cte => 
      cte.chave === chave ? { ...cte, conferido: true } : cte
    ));
  };

  const marcarLoteConferido = (chaves: string[]) => {
    setCtes(prev => prev.map(cte => 
      chaves.includes(cte.chave) ? { ...cte, conferido: true } : cte
    ));
  };

  const verificarCompliance = () => {
    setCtes(prev => {
      const ctesProcessados = prev.map(cte => {
        const compliance = calcularCompliance(cte);
        return { ...cte, ...compliance };
      });
      return detectarDuplicidade(ctesProcessados);
    });
  };

  return (
    <AuditoriaContext.Provider value={{
      ctes,
      logs,
      filters,
      setFilters,
      resetFilters,
      adicionarCtes,
      adicionarLog,
      marcarComoConferido,
      marcarLoteConferido,
      verificarCompliance
    }}>
      {children}
    </AuditoriaContext.Provider>
  );
}

export function useAuditoria() {
  const context = useContext(AuditoriaContext);
  if (!context) {
    throw new Error("useAuditoria must be used within AuditoriaProvider");
  }
  return context;
}