"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Navigation } from "@/components/Navigation";
import { ProductImageWithFallback } from "@/components/ProductImageWithFallback";
import { getPermissions } from "@/lib/permissions";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
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
  status: "PENDING" | "CONFIRMED" | "IN_ROUTE" | "DELIVERED";
  createdAt: string;
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
  paymentMethod: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO";
  deliveryDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  deliveryPersonId?: string | null;
  deliveryPerson?: {
    id: string;
    name: string;
    email: string;
  } | null;
  boletoInstallments?: BoletoInstallment[];
  user: {
    name: string;
    email: string;
  };
  items: OrderItem[];
  files: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deliveryDateInput, setDeliveryDateInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("PIX");
  const [deliveryFeeInput, setDeliveryFeeInput] = useState("0");
  const [paidAtInput, setPaidAtInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installments, setInstallments] = useState<Array<{ amount: number; dueDate: string }>>([]);
  const [isSavingInstallments, setIsSavingInstallments] = useState(false);
  const [deliveryPersons, setDeliveryPersons] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);

  const paymentOptions: Array<{ value: Order["paymentMethod"]; label: string }> = [
    { value: "PIX", label: "PIX" },
    { value: "CREDIT_CARD", label: "Cartão de Crédito" },
    { value: "DEBIT_CARD", label: "Cartão de Débito" },
    { value: "CASH", label: "Dinheiro" },
    { value: "BOLETO", label: "Boleto" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role) {
      // Definir permissões do usuário
      const userPermissions = getPermissions(session.user.role);
      setPermissions(userPermissions);
      fetchOrder();
      // Apenas buscar entregadores se tiver permissão para atribuir
      if (userPermissions.canAssignDelivery) {
        fetchDeliveryPersons();
      }
    }
  }, [status, session, router]);

  async function fetchOrder() {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`);
      if (!response.ok) throw new Error("Erro ao buscar pedido");
      const data = await response.json();
      setOrder(data.order);

      const orderData: Order = data.order;
      
      // Converter datas UTC para local antes de formatar
      if (orderData.deliveryDate) {
        const deliveryDate = new Date(orderData.deliveryDate);
        const year = deliveryDate.getFullYear();
        const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
        const day = String(deliveryDate.getDate()).padStart(2, '0');
        setDeliveryDateInput(`${year}-${month}-${day}`);
      } else {
        setDeliveryDateInput("");
      }
      
      setPaymentMethod(orderData.paymentMethod);
      setDeliveryFeeInput(orderData.deliveryFee?.toString() ?? "0");
      
      if (orderData.paidAt) {
        const paidDate = new Date(orderData.paidAt);
        const year = paidDate.getFullYear();
        const month = String(paidDate.getMonth() + 1).padStart(2, '0');
        const day = String(paidDate.getDate()).padStart(2, '0');
        setPaidAtInput(`${year}-${month}-${day}`);
      } else {
        setPaidAtInput("");
      }
      setNotesInput(orderData.notes || "");
      setSelectedDeliveryPerson(orderData.deliveryPersonId || "");

      if (orderData.boletoInstallments && orderData.boletoInstallments.length > 0) {
        setInstallmentCount(orderData.boletoInstallments.length);
        setInstallments(
          orderData.boletoInstallments.map((inst) => {
            // Formatar data corretamente para o input type="date" (YYYY-MM-DD)
            // Garantir que usamos a data local, não UTC
            const date = new Date(inst.dueDate);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            return {
              amount: inst.amount,
              dueDate: formattedDate,
            };
          })
        );
      } else {
        setInstallmentCount(1);
        setInstallments([{ amount: orderData.total, dueDate: "" }]);
      }
    } catch (error) {
      toast.error("Erro ao carregar pedido");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    // FINANCIAL não pode alterar status de entrega
    if (session?.user?.role === "FINANCIAL") {
      toast.error("Você não tem permissão para alterar o status de entrega");
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar status");

      toast.success("Status atualizado com sucesso");
      fetchOrder();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  }

  async function handleUpdateDetails() {
    if (!order) return;

    // FINANCIAL só pode editar campos financeiros
    const isFinancialOnly = session?.user?.role === "FINANCIAL";
    
    const payload: Record<string, unknown> = {
      paymentMethod,
      paidAt: paidAtInput || null,
      notes: notesInput.trim() || null,
    };

    // Apenas ADMIN e MANAGEMENT podem editar deliveryDate e deliveryFee
    if (!isFinancialOnly) {
      const deliveryFee = Number(deliveryFeeInput);
      if (Number.isNaN(deliveryFee)) {
        toast.error("Informe um valor válido para a taxa de entrega");
        return;
      }
      payload.deliveryDate = deliveryDateInput || null;
      payload.deliveryFee = deliveryFee;
    }

    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao atualizar dados do pedido");

      toast.success("Informações atualizadas");
      fetchOrder();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar informações");
    }
  }

  async function handleSaveInstallments() {
    if (!order || paymentMethod !== "BOLETO") return;

    const validInstallments = installments.filter((inst) => inst.dueDate);

    if (validInstallments.length === 0) {
      toast.error("Informe pelo menos uma parcela com data de vencimento");
      return;
    }

    try {
      setIsSavingInstallments(true);
      const response = await fetch(`/api/admin/orders/${params.id}/installments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ installments: validInstallments }),
      });

      if (!response.ok) throw new Error("Erro ao salvar parcelas");

      toast.success("Parcelas salvas com sucesso");
      fetchOrder();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar parcelas");
    } finally {
      setIsSavingInstallments(false);
    }
  }

  async function handleMarkInstallmentPaid(installmentId: string, paid: boolean) {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/installments/${installmentId}/pay`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paid, paymentDate: new Date().toISOString() }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar parcela");

      toast.success(paid ? "Parcela marcada como paga" : "Parcela desmarcada");
      fetchOrder();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar parcela");
    }
  }

  function handleInstallmentCountChange(count: number) {
    if (count < 1 || count > 12) return;

    setInstallmentCount(count);
    const total = order?.total ?? 0;
    const amountPerInstallment = total / count;

    const newInstallments = Array.from({ length: count }, (_, i) => ({
      amount: i === count - 1 ? total - amountPerInstallment * (count - 1) : amountPerInstallment,
      dueDate: installments[i]?.dueDate || "",
    }));

    setInstallments(newInstallments);
  }

  function handleSendWhatsAppReminder(installment: BoletoInstallment) {
    if (!order) return;

    const dueDate = new Date(installment.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let message = "";
    if (daysUntilDue < 0) {
      message = `Olá ${order.customerName}! Lembramos que sua parcela ${installment.installmentNumber} de R$ ${installment.amount.toFixed(2)} do pedido #${order.id.slice(0, 8)} já venceu. Por favor, entre em contato para regularizar.`;
    } else if (daysUntilDue <= 3) {
      message = `Olá ${order.customerName}! Lembramos que sua parcela ${installment.installmentNumber} de R$ ${installment.amount.toFixed(2)} do pedido #${order.id.slice(0, 8)} vence em ${daysUntilDue} dia(s) (${dueDate.toLocaleDateString("pt-BR")}).`;
    } else {
      message = `Olá ${order.customerName}! Lembramos que sua parcela ${installment.installmentNumber} de R$ ${installment.amount.toFixed(2)} do pedido #${order.id.slice(0, 8)} vence em ${dueDate.toLocaleDateString("pt-BR")}.`;
    }

    const whatsappUrl = `https://wa.me/55${order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/orders/${params.id}/files`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro ao fazer upload do arquivo");

      toast.success("Arquivo anexado com sucesso");
      fetchOrder();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao anexar arquivo");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteFile(fileId: string) {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao remover arquivo");

      toast.success("Arquivo removido com sucesso");
      fetchOrder();
    } catch (error) {
      console.error("Erro ao remover arquivo:", error);
      toast.error("Erro ao remover arquivo");
    }
  }

  async function fetchDeliveryPersons() {
    try {
      const response = await fetch("/api/admin/delivery-persons");
      if (!response.ok) throw new Error("Erro ao buscar entregadores");
      const data = await response.json();
      setDeliveryPersons(data.deliveryPersons || []);
    } catch (error) {
      console.error("Erro ao buscar entregadores:", error);
    }
  }

  async function handleAssignDeliveryPerson() {
    if (!selectedDeliveryPerson) {
      toast.error("Selecione um entregador");
      return;
    }

    try {
      setIsAssigning(true);
      const response = await fetch(`/api/admin/orders/${params.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryPersonId: selectedDeliveryPerson }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao atribuir entregador");
      }

      toast.success("Entregador atribuído com sucesso!");
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir entregador");
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleRemoveDeliveryPerson() {
    try {
      setIsAssigning(true);
      const response = await fetch(`/api/admin/orders/${params.id}/assign`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao remover entregador");
      }

      toast.success("Atribuição removida com sucesso!");
      setSelectedDeliveryPerson("");
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover atribuição");
    } finally {
      setIsAssigning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Pedido não encontrado</h2>
            <button
              onClick={() => router.push("/admin/orders")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Voltar para Pedidos
            </button>
          </div>
        </main>
      </div>
    );
  }

  const subtotal = order.subtotal ?? order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = order.deliveryFee ?? 0;
  const total = order.total ?? subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Pedido #{order.id}
              </h1>
              <p className="text-gray-600 mt-1">
                Data: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/admin/orders/${order.id}/print`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </button>
              {/* FINANCIAL não pode alterar status de entrega, apenas visualizar */}
              {permissions?.canAssignDelivery ? (
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="block pl-3 pr-10 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="IN_ROUTE">Em Rota</option>
                  <option value="DELIVERED">Entregue</option>
                </select>
              ) : (
                <div className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600">
                  {order.status === "PENDING" ? "Pendente" : order.status === "CONFIRMED" ? "Confirmado" : order.status === "IN_ROUTE" ? "Em Rota" : "Entregue"}
                </div>
              )}
              <button
                onClick={() => router.push("/admin/orders")}
                className="text-gray-600 hover:text-gray-800"
              >
                Voltar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Informações do Cliente</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-gray-800">
                  <span className="font-medium">Usuário:</span> {order.user.name}
                </p>
                <p className="text-gray-800">
                  <span className="font-medium">Email:</span> {order.user.email}
                </p>
                <div className="border-t pt-3">
                  <p className="text-gray-800">
                    <span className="font-medium">Contato para entrega:</span> {order.customerName}
                  </p>
                  <p className="text-gray-600">Telefone: {order.phone}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Endereço de Entrega</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-gray-800">
                  {order.deliveryAddress}, {order.deliveryNumber}
                  {order.deliveryComplement ? ` - ${order.deliveryComplement}` : ""}
                </p>
                <p className="text-gray-600">Bairro: {order.deliveryNeighborhood}</p>
                <p className="text-gray-600">
                  Cidade: {order.deliveryCity}
                  {order.deliveryState ? `/${order.deliveryState}` : ""}
                </p>
                <p className="text-gray-600">Taxa aplicada: R$ {deliveryFee.toFixed(2)}</p>
                {order.deliveryDate && (
                  <p className="text-sm text-gray-500">
                    Entrega prevista: {new Date(order.deliveryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {/* Atribuir Entregador - Apenas para usuários com permissão */}
              {permissions?.canAssignDelivery && (
              <div className="mt-6 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Atribuir Entregador</h3>
                {order.status !== "CONFIRMED" ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ O pedido precisa estar com status <strong>Confirmado</strong> para poder atribuir um entregador.
                    </p>
                  </div>
                ) : order.deliveryPerson ? (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm text-gray-600">Entregador Atual:</p>
                      <p className="font-semibold text-gray-900">{order.deliveryPerson.name}</p>
                      <p className="text-xs text-gray-500">{order.deliveryPerson.email}</p>
                    </div>
                    <button
                      onClick={handleRemoveDeliveryPerson}
                      disabled={isAssigning || order.status === ("IN_ROUTE" as Order["status"]) || order.status === ("DELIVERED" as Order["status"])}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                    >
                      {isAssigning ? "Removendo..." : "Remover Entregador"}
                    </button>
                    {(order.status === ("IN_ROUTE" as Order["status"]) || order.status === ("DELIVERED" as Order["status"])) && (
                      <p className="text-xs text-gray-500 text-center">
                        Não é possível remover entregador de pedidos em rota ou entregues
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedDeliveryPerson}
                      onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Selecione um entregador</option>
                      {deliveryPersons.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name} - {person.email}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignDeliveryPerson}
                      disabled={isAssigning || !selectedDeliveryPerson || order.status !== "CONFIRMED"}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                    >
                      {isAssigning ? "Atribuindo..." : "Atribuir Entregador"}
                    </button>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h2 className="text-xl font-semibold">Resumo Financeiro</h2>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entrega</span>
                  <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h2 className="text-xl font-semibold">Controle de Pagamento e Entrega</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as Order["paymentMethod"])}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  >
                    {paymentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FINANCIAL não pode editar taxa de entrega e data de entrega */}
                {permissions?.canAssignDelivery && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Taxa de Entrega</label>
                      <input
                        type="number"
                        step="0.01"
                        value={deliveryFeeInput}
                        onChange={(event) => setDeliveryFeeInput(event.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Data de Entrega</label>
                      <input
                        type="date"
                        value={deliveryDateInput}
                        onChange={(event) => setDeliveryDateInput(event.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </>
                )}
                {!permissions?.canAssignDelivery && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Taxa de Entrega</label>
                      <div className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600">
                        R$ {order.deliveryFee?.toFixed(2) || "0.00"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Data de Entrega</label>
                      <div className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600">
                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Não definida"}
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod !== "BOLETO" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Data de Pagamento</label>
                    <input
                      type="date"
                      value={paidAtInput}
                      onChange={(event) => setPaidAtInput(event.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  value={notesInput}
                  onChange={(event) => setNotesInput(event.target.value)}
                  placeholder="Adicione observações sobre o pedido..."
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
                <p className="text-xs text-gray-500">As observações aparecerão no pedido de compra impresso</p>
              </div>

              {paymentMethod === "BOLETO" && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="block text-sm font-medium text-gray-700">Quantidade de Parcelas:</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={installmentCount}
                      onChange={(e) => handleInstallmentCountChange(Number(e.target.value))}
                      className="w-20 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    {installments.map((inst, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={inst.amount}
                          onChange={(e) => {
                            const newInstallments = [...installments];
                            newInstallments[index].amount = Number(e.target.value);
                            setInstallments(newInstallments);
                          }}
                          placeholder="Valor"
                          className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => {
                            const newInstallments = [...installments];
                            newInstallments[index].dueDate = e.target.value;
                            setInstallments(newInstallments);
                          }}
                          placeholder="Data de vencimento"
                          className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveInstallments}
                    disabled={isSavingInstallments}
                    className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    {isSavingInstallments ? "Salvando..." : "Salvar Parcelas"}
                  </button>
                </div>
              )}

              {paymentMethod === "BOLETO" && order.boletoInstallments && order.boletoInstallments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold text-gray-800">Parcelas Cadastradas</h3>
                  {order.boletoInstallments.map((installment) => {
                    const dueDate = new Date(installment.dueDate);
                    const now = new Date();
                    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isOverdue = daysUntilDue < 0;
                    const isUpcoming = daysUntilDue >= 0 && daysUntilDue <= 3;

                    return (
                      <div
                        key={installment.id}
                        className={`p-3 rounded-lg border-2 ${
                          installment.paidAt
                            ? "bg-green-50 border-green-200"
                            : isOverdue
                            ? "bg-red-50 border-red-200"
                            : isUpcoming
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              Parcela {installment.installmentNumber} - R$ {installment.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Vencimento: {dueDate.toLocaleDateString("pt-BR")}
                              {isOverdue && <span className="text-red-600 ml-2">(Vencida)</span>}
                              {isUpcoming && !isOverdue && (
                                <span className="text-yellow-600 ml-2">(Vence em {daysUntilDue} dias)</span>
                              )}
                            </p>
                            {installment.paidAt && (
                              <p className="text-sm text-green-600">
                                Pago em: {new Date(installment.paidAt).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!installment.paidAt && (isOverdue || isUpcoming) && (
                              <button
                                onClick={() => handleSendWhatsAppReminder(installment)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                              >
                                Enviar Lembrete
                              </button>
                            )}
                            <button
                              onClick={() => handleMarkInstallmentPaid(installment.id, !installment.paidAt)}
                              className={`px-3 py-1 text-sm rounded-lg ${
                                installment.paidAt
                                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  : "bg-green-600 text-white hover:bg-green-700"
                              }`}
                            >
                              {installment.paidAt ? "Desmarcar" : "Marcar como Pago"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={handleUpdateDetails}
                className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold mt-4"
              >
                Salvar alterações
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Itens do Pedido</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex items-center">
                    <ProductImageWithFallback
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-800">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.quantity}x - R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-800">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Documentos</h2>
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Anexar Arquivo
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              {order.files && order.files.length > 0 ? (
                order.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-800">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum arquivo anexado</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 