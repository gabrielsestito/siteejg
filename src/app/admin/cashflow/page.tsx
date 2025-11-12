"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Navigation } from "@/components/Navigation";
import { getPermissions, canAccessAdmin } from "@/lib/permissions";

interface CashFlowEntry {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentDate: string;
  paymentMethod?: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO" | null;
  order?: {
    id: string;
    customerName: string;
    phone: string;
    paymentMethod: string;
  } | null;
}

interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function CashFlowPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [permissions, setPermissions] = useState<any>(null);
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    type: "",
    search: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: "",
    description: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "" as "" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<{
    type: "INCOME" | "EXPENSE";
    amount: string;
    description: string;
    paymentDate: string;
    paymentMethod: "" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO" | null;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const paymentMethodLabels: Record<string, string> = {
    PIX: "PIX",
    CREDIT_CARD: "Cartão de Crédito",
    DEBIT_CARD: "Cartão de Débito",
    CASH: "Dinheiro",
    BOLETO: "Boleto",
  };

  function getPaymentMethodLabel(method: string | null | undefined): string {
    if (!method) return "-";
    return paymentMethodLabels[method] || method;
  }

  async function fetchCashFlow() {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.type) params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/admin/cashflow?${params.toString()}`);
      if (!response.ok) throw new Error("Erro ao buscar fluxo de caixa");
      const data = await response.json();
      setEntries(data.entries);
      setSummary(data.summary);
    } catch (error) {
      toast.error("Erro ao carregar fluxo de caixa");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role) {
      if (!canAccessAdmin(session.user.role)) {
        router.push("/");
        return;
      }
      const userPermissions = getPermissions(session.user.role);
      setPermissions(userPermissions);
      
      if (!userPermissions.canViewCashFlow) {
        router.push("/admin");
        toast.error("Você não tem permissão para acessar o fluxo de caixa");
        return;
      }
      
      const timeoutId = setTimeout(() => {
        fetchCashFlow();
      }, filters.search ? 500 : 0);
      return () => clearTimeout(timeoutId);
    }
  }, [status, session, filters.dateFrom, filters.dateTo, filters.type, router]);

  useEffect(() => {
    if (session && filters.search !== undefined) {
      const timeoutId = setTimeout(() => {
        fetchCashFlow();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [filters.search, session]);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();

    if (!newEntry.amount || !newEntry.description || !newEntry.paymentDate) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const response = await fetch("/api/admin/cashflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });

      if (!response.ok) throw new Error("Erro ao criar entrada");

      toast.success("Entrada criada com sucesso");
      setShowAddForm(false);
      setNewEntry({
        type: "EXPENSE",
        amount: "",
        description: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "",
      });
      fetchCashFlow();
    } catch (error) {
      toast.error("Erro ao criar entrada");
    }
  }

  function handleEditClick(entry: CashFlowEntry) {
    setEditingId(entry.id);
    setEditingEntry({
      type: entry.type,
      amount: entry.amount.toString(),
      description: entry.description,
      paymentDate: entry.paymentDate.split("T")[0],
      paymentMethod: entry.paymentMethod || null,
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingEntry(null);
  }

  async function handleUpdateEntry(entryId: string) {
    if (!editingEntry) return;

    if (!editingEntry.amount || !editingEntry.description || !editingEntry.paymentDate) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const response = await fetch(`/api/admin/cashflow/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingEntry),
      });

      if (!response.ok) throw new Error("Erro ao atualizar entrada");

      toast.success("Entrada atualizada com sucesso");
      setEditingId(null);
      setEditingEntry(null);
      fetchCashFlow();
    } catch (error) {
      toast.error("Erro ao atualizar entrada");
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm("Tem certeza que deseja excluir esta entrada?")) {
      return;
    }

    try {
      setIsDeleting(entryId);
      const response = await fetch(`/api/admin/cashflow/${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir entrada");

      toast.success("Entrada excluída com sucesso");
      fetchCashFlow();
    } catch (error) {
      toast.error("Erro ao excluir entrada");
    } finally {
      setIsDeleting(null);
    }
  }

  if (status === "loading" || isLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Fluxo de Caixa</h1>
              <p className="text-gray-600 mt-1">Controle de receitas e despesas</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {showAddForm ? "Cancelar" : "Nova Entrada"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddEntry} className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as "INCOME" | "EXPENSE" })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  >
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={newEntry.paymentDate}
                    onChange={(e) => setNewEntry({ ...newEntry, paymentDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                  <select
                    value={newEntry.paymentMethod}
                    onChange={(e) => setNewEntry({ ...newEntry, paymentMethod: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  >
                    <option value="">Nenhum</option>
                    <option value="PIX">PIX</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                    <option value="DEBIT_CARD">Cartão de Débito</option>
                    <option value="CASH">Dinheiro</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <input
                    type="text"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                Adicionar
              </button>
            </form>
          )}

          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">Total de Receitas</p>
              <p className="text-2xl font-bold text-green-600">R$ {summary.totalIncome.toFixed(2)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
              <p className="text-sm text-gray-600 mb-1">Total de Despesas</p>
              <p className="text-2xl font-bold text-red-600">R$ {summary.totalExpense.toFixed(2)}</p>
            </div>
            <div className={`rounded-xl p-4 border-2 ${
              summary.balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"
            }`}>
              <p className="text-sm text-gray-600 mb-1">Saldo</p>
              <p className={`text-2xl font-bold ${
                summary.balance >= 0 ? "text-blue-600" : "text-orange-600"
              }`}>
                R$ {summary.balance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por nome</label>
              <input
                type="text"
                placeholder="Nome, descrição ou telefone"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="">Todos</option>
                <option value="INCOME">Receitas</option>
                <option value="EXPENSE">Despesas</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ dateFrom: "", dateTo: "", type: "", search: "" })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Lista de entradas */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Método de Pagamento
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Nenhuma entrada encontrada
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        {editingId === entry.id && editingEntry ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="date"
                                value={editingEntry.paymentDate}
                                onChange={(e) =>
                                  setEditingEntry({ ...editingEntry, paymentDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={editingEntry.type}
                                onChange={(e) =>
                                  setEditingEntry({
                                    ...editingEntry,
                                    type: e.target.value as "INCOME" | "EXPENSE",
                                  })
                                }
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
                              >
                                <option value="INCOME">Receita</option>
                                <option value="EXPENSE">Despesa</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editingEntry.description}
                                onChange={(e) =>
                                  setEditingEntry({ ...editingEntry, description: e.target.value })
                                }
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                placeholder="Descrição"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={editingEntry.paymentMethod || ""}
                                onChange={(e) =>
                                  setEditingEntry({
                                    ...editingEntry,
                                    paymentMethod: e.target.value || null,
                                  } as any)
                                }
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
                              >
                                <option value="">Nenhum</option>
                                <option value="PIX">PIX</option>
                                <option value="CREDIT_CARD">Cartão de Crédito</option>
                                <option value="DEBIT_CARD">Cartão de Débito</option>
                                <option value="CASH">Dinheiro</option>
                                <option value="BOLETO">Boleto</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                step="0.01"
                                value={editingEntry.amount}
                                onChange={(e) =>
                                  setEditingEntry({ ...editingEntry, amount: e.target.value })
                                }
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                placeholder="Valor"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateEntry(entry.id)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(entry.paymentDate).toLocaleDateString("pt-BR")}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  entry.type === "INCOME"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {entry.type === "INCOME" ? "Receita" : "Despesa"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{entry.description}</div>
                              {entry.order && (
                                <div className="text-xs text-gray-500">
                                  Pedido: {entry.order.id.slice(0, 8)} - {entry.order.customerName}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                {getPaymentMethodLabel(entry.paymentMethod)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`text-sm font-semibold ${
                                  entry.type === "INCOME" ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {entry.type === "INCOME" ? "+" : "-"} R$ {entry.amount.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditClick(entry)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  disabled={isDeleting === entry.id}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isDeleting === entry.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                      Excluindo...
                                    </>
                                  ) : (
                                    <>
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      Excluir
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

