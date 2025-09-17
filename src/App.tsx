import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuditoriaProvider } from "@/contexts/AuditoriaContext";
import { Layout } from "@/components/Layout";
import Login from "./pages/Login";
import Auditoria from "./pages/Auditoria";
import TabelasFrete from "./pages/TabelasFrete";
import NFeEmbarcador from "./pages/NFeEmbarcador";
import CTeRecebidos from "./pages/CTeRecebidos";
import Fretistas from "./pages/Fretistas";
import Pagamentos from "./pages/Pagamentos";
import ConsultoriaDelta from "./pages/ConsultoriaDelta";
import DocumentacaoAPI from "./pages/DocumentacaoAPI";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuditoriaProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Auditoria />} />
                <Route path="login" element={<Login />} />
                <Route path="auditoria" element={<Auditoria />} />
                <Route path="tabelas-frete" element={<TabelasFrete />} />
                <Route path="nfe-embarcador" element={<NFeEmbarcador />} />
                <Route path="cte-recebidos" element={<CTeRecebidos />} />
                <Route path="fretistas" element={<Fretistas />} />
                <Route path="pagamentos" element={<Pagamentos />} />
                <Route path="consultoria-delta" element={<ConsultoriaDelta />} />
                <Route path="documentacao-api" element={<DocumentacaoAPI />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuditoriaProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
