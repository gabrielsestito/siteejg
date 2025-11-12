"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { COMPANY_INFO } from "@/lib/company";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    description: string;
    image: string;
  };
}

interface BoletoInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAt: string | null;
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  deliveryNumber: string;
  deliveryComplement?: string | null;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryState?: string | null;
  paymentMethod: string;
  deliveryDate?: string | null;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
  boletoInstallments?: BoletoInstallment[];
}

export default function PrintOrderPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  async function fetchOrder() {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`);
      if (!response.ok) throw new Error("Erro ao buscar pedido");
      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      toast.error("Erro ao carregar pedido");
    } finally {
      setIsLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const paymentLabels: Record<string, string> = {
    PIX: "PIX",
    CREDIT_CARD: "Cartão de Crédito",
    DEBIT_CARD: "Cartão de Débito",
    CASH: "Dinheiro",
    BOLETO: "Boleto",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Pedido não encontrado</h2>
          <button
            onClick={() => router.back()}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Botões de controle - não aparecem na impressão */}
      <div className="no-print mb-6 flex gap-4">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          Imprimir
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
        >
          Voltar
        </button>
      </div>

      {/* Conteúdo do pedido */}
      <div className="max-w-4xl mx-auto bg-white">
        {/* Cabeçalho com logo e dados da empresa */}
        <div className="border-b-2 border-gray-800 pb-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt={COMPANY_INFO.name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* Dados da empresa */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{COMPANY_INFO.name}</h1>
                <p className="text-sm text-gray-700">{COMPANY_INFO.fullAddress}</p>
                <p className="text-sm text-gray-700">CNPJ: {COMPANY_INFO.cnpj} | IE: {COMPANY_INFO.ie}</p>
                <p className="text-sm text-gray-700">Telefone: {COMPANY_INFO.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">PEDIDO DE COMPRA</h2>
              <p className="text-gray-700 mt-2 font-semibold">Nº {order.id.slice(0, 8)}</p>
              <p className="text-gray-700">
                Data: {new Date(order.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        {/* Dados do cliente */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">DADOS DO CLIENTE</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800">
              <span className="font-semibold">Nome:</span> {order.customerName}
            </p>
            <p className="text-gray-800 mt-2">
              <span className="font-semibold">Telefone:</span> {order.phone}
            </p>
            <p className="text-gray-800 mt-2">
              <span className="font-semibold">Endereço de Entrega:</span> {order.deliveryAddress}, {order.deliveryNumber}
              {order.deliveryComplement ? ` - ${order.deliveryComplement}` : ""}
            </p>
            <p className="text-gray-800 mt-2">
              <span className="font-semibold">Bairro:</span> {order.deliveryNeighborhood}
            </p>
            <p className="text-gray-800 mt-2">
              <span className="font-semibold">Cidade:</span> {order.deliveryCity}
              {order.deliveryState ? `/${order.deliveryState}` : ""}
            </p>
            {order.deliveryDate && (
              <p className="text-gray-800 mt-2">
                <span className="font-semibold">Data de Entrega Prevista:</span>{" "}
                {new Date(order.deliveryDate).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>

        {/* Itens do pedido */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">ITENS DO PEDIDO</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left" style={{ width: '5%' }}>Item</th>
                <th className="border border-gray-300 px-3 py-2 text-left" style={{ width: '50%' }}>Descrição</th>
                <th className="border border-gray-300 px-3 py-2 text-center" style={{ width: '10%' }}>Qtd</th>
                <th className="border border-gray-300 px-3 py-2 text-right" style={{ width: '15%' }}>Valor Unit.</th>
                <th className="border border-gray-300 px-3 py-2 text-right" style={{ width: '20%' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-3 py-3 align-top text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-3 py-3 align-top">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">{item.product.name}</p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                        {item.product.description}
                      </p>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-center align-top">{item.quantity}</td>
                  <td className="border border-gray-300 px-3 py-3 text-right align-top">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-right align-top font-semibold">
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo financeiro */}
        <div className="mb-6">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Taxa de Entrega:</span>
                  <span className="font-semibold">R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forma de pagamento */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">FORMA DE PAGAMENTO</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800">
              <span className="font-semibold">Método:</span> {paymentLabels[order.paymentMethod] || order.paymentMethod}
            </p>
            {order.paymentMethod === "BOLETO" && order.boletoInstallments && order.boletoInstallments.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-gray-800 mb-2">Parcelas:</p>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Parcela</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Valor</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Vencimento</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.boletoInstallments.map((installment) => (
                      <tr key={installment.id}>
                        <td className="border border-gray-300 px-4 py-2">
                          {installment.installmentNumber}ª Parcela
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          R$ {installment.amount.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {installment.paidAt ? (
                            <span className="text-green-600 font-semibold">Pago</span>
                          ) : (
                            <span className="text-yellow-600 font-semibold">Pendente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        {order.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">OBSERVAÇÕES</h3>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-600">
              <p className="text-gray-800 whitespace-pre-wrap break-words">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Rodapé com assinaturas */}
        <div className="mt-12 border-t-2 border-gray-800 pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-gray-800 font-semibold mb-4">Cliente:</p>
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-sm text-gray-600 mt-2">{order.customerName}</p>
            </div>
            <div>
              <p className="text-gray-800 font-semibold mb-4">Empresa:</p>
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-sm text-gray-600 mt-2">{COMPANY_INFO.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 1.5cm;
            size: A4;
          }
          /* Remove URLs e outros elementos do navegador na impressão */
          a[href]:after {
            content: "" !important;
          }
          /* Garante que as cores de fundo sejam impressas */
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

