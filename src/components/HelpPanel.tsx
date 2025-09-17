import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, X } from "lucide-react";

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between bg-blue-50">
          <CardTitle className="text-xl">❓ Guia Rápido - Sistema de Auditoria</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* O que é um CT-e */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-blue-700">📄 O que é um CT-e?</h3>
            <p className="text-gray-700">
              <strong>CT-e</strong> é o documento fiscal obrigatório para transporte de cargas. 
              É como uma "nota fiscal do frete" que comprova que o transporte foi feito legalmente.
            </p>
          </div>

          {/* Status dos documentos */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-green-700">✅ Situações dos Documentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <Badge className="bg-green-100 text-green-700 mb-2">Aprovado</Badge>
                <p className="text-sm text-green-700">
                  Documento está correto e pode ser processado para pagamento.
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <Badge className="bg-red-100 text-red-700 mb-2">❌ Tem problema</Badge>
                <p className="text-sm text-red-700">
                  Documento tem erro fiscal ou de valores. Precisa ser corrigido antes do pagamento.
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <Badge className="bg-yellow-100 text-yellow-700 mb-2">⏳ Em análise</Badge>
                <p className="text-sm text-yellow-700">
                  Documento ainda está sendo analisado pelo sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Tipos de serviço */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-purple-700">💼 Tipos de Serviço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <Badge variant="outline" className="mb-2">📦 NORMAL</Badge>
                <p className="text-sm text-gray-700">
                  A própria empresa faz o transporte diretamente.
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Badge className="bg-purple-100 text-purple-700 mb-2">🔧 EXECUTORA</Badge>
                <p className="text-sm text-purple-700">
                  Empresa terceirizada que realmente faz o transporte.
                  <strong> → Esta deve ser paga.</strong>
                </p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <Badge className="bg-indigo-100 text-indigo-700 mb-2">📋 CONTRATANTE</Badge>
                <p className="text-sm text-indigo-700">
                  Empresa que contrata a terceirizada.
                  <strong> → Esta NÃO deve ser paga.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Situações especiais */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-orange-700">⚠️ Situações Especiais</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-orange-50 rounded">
                <Badge className="bg-orange-100 text-orange-700">⚠️ Possível Duplicata</Badge>
                <span className="text-sm text-orange-700">
                  Documento pode estar repetido. Verificar antes de pagar.
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
                <Badge variant="outline" className="text-gray-600">🚫 NÃO PAGAR</Badge>
                <span className="text-sm text-red-700">
                  Documento bloqueado: pode ter duplicidade, erro fiscal ou não deve ser pago.
                </span>
              </div>
            </div>
          </div>

          {/* Ações principais */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-emerald-700">⚡ Principais Ações</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full justify-start pointer-events-none">
                  <HelpCircle className="h-3 w-3 mr-2" />
                  👁️ Ver Detalhes
                </Button>
                <p className="text-xs text-gray-600">Abre informações completas do documento</p>
              </div>
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full justify-start pointer-events-none text-green-700 border-green-200">
                  <HelpCircle className="h-3 w-3 mr-2" />
                  ✅ Marcar OK
                </Button>
                <p className="text-xs text-gray-600">Confirma que o documento foi verificado</p>
              </div>
              <div className="space-y-2">
                <Button size="sm" className="w-full justify-start pointer-events-none bg-green-600 text-white">
                  <HelpCircle className="h-3 w-3 mr-2" />
                  💳 Enviar Pagamento
                </Button>
                <p className="text-xs text-gray-600">Libera o documento para o financeiro pagar</p>
              </div>
              <div className="space-y-2">
                <Button size="sm" variant="ghost" disabled className="w-full justify-start pointer-events-none text-gray-500">
                  🚫 Bloqueado
                </Button>
                <p className="text-xs text-gray-600">Documento não pode ser pago (tem problema)</p>
              </div>
            </div>
          </div>

          {/* Dica importante */}
          <div className="bg-blue-100 border border-blue-300 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-700 mb-2">💡 Dica Importante</h4>
            <p className="text-sm text-blue-700">
              <strong>Regra de Ouro:</strong> Só pode ser pago o documento que estiver com 
              <span className="bg-green-200 px-1 rounded">Aprovado</span> e 
              <span className="bg-green-200 px-1 rounded">💳 PODE PAGAR</span>. 
              Todo o resto deve ser bloqueado até resolver o problema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}