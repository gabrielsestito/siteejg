"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Navigation } from "@/components/Navigation";
import { getPermissions, canAccessAdmin } from "@/lib/permissions";

interface Order {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  status: string;
  total: number;
  createdAt: string;
  customerName: string;
  deliveryCity: string;
  paymentMethod: string;
  deliveryFee: number;
  subtotal?: number;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }>;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  state: string;
  deliveryFee: number;
  active: boolean;
}

// Helper function para fazer fetch com tratamento de erro
async function safeFetchJson(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error(`Erro na resposta de ${url}:`, text);
      throw new Error(`Erro ${response.status}: ${text.substring(0, 100)}`);
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(`Resposta não é JSON de ${url}:`, text.substring(0, 200));
      throw new Error("Resposta da API não é JSON válido");
    }
    return await response.json();
  } catch (error: any) {
    if (error.message.includes("JSON")) {
      throw error;
    }
    throw new Error(`Erro ao fazer requisição: ${error.message}`);
  }
}

// Componente Dashboard
function DashboardTab({ permissions, router }: { permissions: any; router: any }) {
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await safeFetchJson("/api/admin/dashboard/stats");
      setStats(data.stats);
    } catch (error: any) {
      console.error("Erro ao carregar estatísticas:", error);
      setStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {permissions?.canViewOrders && stats?.orders && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total de Pedidos</p>
                  <p className="text-3xl font-bold mt-2">{stats.orders.total}</p>
                </div>
                <div className="bg-blue-400/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Pedidos Hoje</p>
                  <p className="text-3xl font-bold mt-2">{stats.orders.today}</p>
                </div>
                <div className="bg-green-400/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Receita do Mês</p>
                  <p className="text-2xl font-bold mt-2">R$ {stats.orders.thisMonthRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-purple-400/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Em Rota</p>
                  <p className="text-3xl font-bold mt-2">{stats.orders.inRoute}</p>
                </div>
                <div className="bg-orange-400/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </>
        )}
        {permissions?.canViewProducts && stats?.products && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Produtos</p>
                <p className="text-3xl font-bold mt-2">{stats.products.total}</p>
                {stats.products.lowStock > 0 && (
                  <p className="text-indigo-200 text-xs mt-1">{stats.products.lowStock} com estoque baixo</p>
                )}
              </div>
              <div className="bg-indigo-400/20 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
        {permissions?.canViewCashFlow && stats?.cashFlow && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Saldo do Mês</p>
                <p className={`text-2xl font-bold mt-2 ${stats.cashFlow.balance >= 0 ? '' : 'text-red-200'}`}>
                  R$ {stats.cashFlow.balance.toFixed(2)}
                </p>
                {stats.cashFlow.thisMonthIncome > 0 && (
                  <p className="text-emerald-200 text-xs mt-1">Receitas: R$ {stats.cashFlow.thisMonthIncome.toFixed(2)}</p>
                )}
                {stats.cashFlow.thisMonthExpense > 0 && (
                  <p className="text-emerald-200 text-xs mt-1">Despesas: R$ {stats.cashFlow.thisMonthExpense.toFixed(2)}</p>
                )}
              </div>
              <div className="bg-emerald-400/20 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </div>


      {/* Status dos Pedidos */}
      {permissions?.canViewOrders && stats?.orders && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-600 text-sm font-medium">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.orders.pending}</p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-blue-600 text-sm font-medium">Confirmados</p>
            <p className="text-2xl font-bold text-blue-700">{stats.orders.confirmed}</p>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
            <p className="text-orange-600 text-sm font-medium">Em Rota</p>
            <p className="text-2xl font-bold text-orange-700">{stats.orders.inRoute}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <p className="text-green-600 text-sm font-medium">Entregues</p>
            <p className="text-2xl font-bold text-green-700">{stats.orders.delivered}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Users Tab
function UsersTab({
  users,
  userForm,
  setUserForm,
  editingUser,
  isSavingUser,
  handleCreateUser,
  handleUpdateUser,
  handleEditUser,
  resetUserForm,
  session,
}: any) {
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      USER: "Cliente",
      ADMIN: "Administrador",
      DELIVERY: "Entregador",
      FINANCIAL: "Financeiro",
      MANAGEMENT: "Gerência",
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      USER: "bg-gray-100 text-gray-800",
      ADMIN: "bg-red-100 text-red-800",
      DELIVERY: "bg-blue-100 text-blue-800",
      FINANCIAL: "bg-green-100 text-green-800",
      MANAGEMENT: "bg-purple-100 text-purple-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Criar/Editar Usuário */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border-2 border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {editingUser ? "Editar Usuário" : "Criar Novo Usuário"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
            </label>
            <input
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={editingUser ? "Nova senha (opcional)" : "Senha"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="USER">Cliente</option>
              <option value="ADMIN">Administrador</option>
              <option value="DELIVERY">Entregador</option>
              <option value="FINANCIAL">Financeiro</option>
              <option value="MANAGEMENT">Gerência</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={editingUser ? handleUpdateUser : handleCreateUser}
            disabled={isSavingUser}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold flex items-center gap-2"
          >
            {isSavingUser ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : editingUser ? (
              "Atualizar Usuário"
            ) : (
              "Criar Usuário"
            )}
          </button>
          {editingUser && (
            <button
              onClick={resetUserForm}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Usuários Cadastrados</h3>
          <p className="text-sm text-gray-600 mt-1">Gerencie todos os usuários do sistema</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Função</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cadastrado em</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user: any) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{user.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.id !== session?.user?.id && (
                      <button
                        onClick={() => handleEditUser(user)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "unpaidOrders" | "products" | "categories" | "users" | "deliveryZones" | "deliveryPersons" | "cashflow">("dashboard");
  const [permissions, setPermissions] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "ADMIN" | "DELIVERY" | "FINANCIAL" | "MANAGEMENT",
  });
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [unpaidOrdersStats, setUnpaidOrdersStats] = useState({ overdue: 0, upcoming: 0, normal: 0, total: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<string | null>(null);
  const [deliveryPersonOrders, setDeliveryPersonOrders] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    city: "",
    state: "SP",
    deliveryFee: "",
    active: true,
  });
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [isSavingZone, setIsSavingZone] = useState(false);

  const paymentLabels: Record<string, string> = {
    PIX: "PIX",
    CREDIT_CARD: "Cartão de Crédito",
    DEBIT_CARD: "Cartão de Débito",
    CASH: "Dinheiro",
    BOLETO: "Boleto",
  };
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role) {
      if (!canAccessAdmin(session.user.role)) {
        router.push("/");
        return;
      }
      // Sempre definir permissões se tiver acesso ao admin
      const userPermissions = getPermissions(session.user.role);
      setPermissions(userPermissions);
      setIsLoading(false);
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!permissions) return;
    
    // Se o usuário tentar acessar uma tab que não tem permissão, redirecionar para dashboard
    // FINANCIAL agora tem permissão para ver orders e unpaidOrders, então não precisa redirecionar
    if (activeTab === "products" && !permissions?.canViewProducts) {
      setActiveTab("dashboard");
      return;
    }
    if (activeTab === "categories" && !permissions?.canViewCategories) {
      setActiveTab("dashboard");
      return;
    }
    if (activeTab === "users" && !permissions?.canViewUsers) {
      setActiveTab("dashboard");
      return;
    }
    if (activeTab === "deliveryZones" && !permissions?.canViewDeliveryZones) {
      setActiveTab("dashboard");
      return;
    }
    if (activeTab === "deliveryPersons" && !permissions?.canViewDeliveryPersons) {
      setActiveTab("dashboard");
      return;
    }
    if (activeTab === "orders" && !permissions?.canViewOrders) {
      setActiveTab("dashboard");
      return;
    }
    if (activeTab === "unpaidOrders" && !permissions?.canViewUnpaidOrders) {
      setActiveTab("dashboard");
      return;
    }
    
    if (activeTab === "dashboard") {
      // Dashboard não precisa de fetch específico, ele faz seu próprio fetch
      setIsLoading(false);
    } else if (activeTab === "orders" && permissions?.canViewOrders) {
      fetchOrders();
    } else if (activeTab === "unpaidOrders" && permissions?.canViewUnpaidOrders) {
      fetchUnpaidOrders();
    } else if (activeTab === "products" && permissions?.canViewProducts) {
      fetchProducts();
    } else if (activeTab === "categories" && permissions?.canViewCategories) {
      // Categorias são carregadas quando necessário
      setIsLoading(false);
    } else if (activeTab === "users" && permissions?.canViewUsers) {
      fetchUsers();
    } else if (activeTab === "deliveryZones" && permissions?.canViewDeliveryZones) {
      fetchDeliveryZones();
    } else if (activeTab === "deliveryPersons" && permissions?.canViewDeliveryPersons) {
      fetchDeliveryPersons();
    } else {
      setIsLoading(false);
    }
  }, [activeTab, permissions]);

  const fetchOrders = async () => {
    try {
      const data = await safeFetchJson("/api/admin/orders");
      setOrders(data.orders || []);
    } catch (error: any) {
      console.error("Erro ao carregar pedidos:", error);
      toast.error(error.message || "Erro ao carregar pedidos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnpaidOrders = async () => {
    try {
      setIsLoading(true);
      const data = await safeFetchJson("/api/admin/orders/unpaid");
      setUnpaidOrders(data.orders || []);
      setUnpaidOrdersStats({
        overdue: data.overdue?.length || 0,
        upcoming: data.upcoming?.length || 0,
        normal: data.normal?.length || 0,
        total: data.total || 0,
      });
    } catch (error: any) {
      console.error("Erro ao carregar pedidos não pagos:", error);
      toast.error(error.message || "Erro ao carregar pedidos não pagos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await safeFetchJson("/api/admin/products");
      setProducts(data.products || []);
    } catch (error: any) {
      console.error("Erro ao carregar produtos:", error);
      toast.error(error.message || "Erro ao carregar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await safeFetchJson("/api/admin/users/list");
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast.error(error.message || "Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveryZones = async () => {
    try {
      setIsLoading(true);
      const data = await safeFetchJson("/api/admin/delivery-zones");
      setDeliveryZones(data.zones || []);
    } catch (error: any) {
      console.error("Erro ao carregar zonas de entrega:", error);
      toast.error(error.message || "Erro ao carregar zonas de entrega");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSavingUser(true);
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar usuário");
      }

      toast.success("Usuário criado com sucesso!");
      resetUserForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!userForm.name || !userForm.email) {
      toast.error("Preencha nome e email");
      return;
    }

    try {
      setIsSavingUser(true);
      const response = await fetch("/api/admin/users/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: editingUser.id,
          name: userForm.name,
          email: userForm.email,
          password: userForm.password || undefined,
          role: userForm.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar usuário");
      }

      toast.success("Usuário atualizado com sucesso!");
      resetUserForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
  };

  const resetUserForm = () => {
    setUserForm({ name: "", email: "", password: "", role: "USER" });
    setEditingUser(null);
  };

  const fetchDeliveryPersons = async () => {
    try {
      setIsLoading(true);
      const data = await safeFetchJson("/api/admin/delivery-persons/manage");
      setDeliveryPersons(data.deliveryPersons || []);
    } catch (error: any) {
      console.error("Erro ao carregar entregadores:", error);
      toast.error(error.message || "Erro ao carregar entregadores");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDeliveryPerson = async (email: string) => {
    try {
      const response = await fetch("/api/admin/delivery-persons/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao adicionar entregador");
      }

      toast.success("Entregador adicionado com sucesso");
      fetchDeliveryPersons();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar entregador");
    }
  };

  const handleRemoveDeliveryPerson = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/delivery-persons/manage?userId=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao remover entregador");
      }

      toast.success("Entregador removido com sucesso");
      fetchDeliveryPersons();
      if (selectedDeliveryPerson === userId) {
        setSelectedDeliveryPerson(null);
        setDeliveryPersonOrders(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover entregador");
    }
  };

  const fetchDeliveryPersonOrders = async (deliveryPersonId: string) => {
    try {
      setIsLoadingOrders(true);
      const data = await safeFetchJson(`/api/admin/delivery-persons/${deliveryPersonId}/orders`);
      setDeliveryPersonOrders(data);
    } catch (error: any) {
      console.error("Erro ao carregar pedidos do entregador:", error);
      toast.error(error.message || "Erro ao carregar pedidos do entregador");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders/available");
      if (!response.ok) throw new Error("Erro ao buscar pedidos disponíveis");
      const data = await response.json();
      setAvailableOrders(data.orders || []);
    } catch (error) {
      toast.error("Erro ao carregar pedidos disponíveis");
    }
  };

  const handleViewDeliveryPersonOrders = async (deliveryPersonId: string) => {
    setSelectedDeliveryPerson(deliveryPersonId);
    await fetchDeliveryPersonOrders(deliveryPersonId);
    await fetchAvailableOrders();
  };

  const handleAssignOrderToDeliveryPerson = async (orderId: string, deliveryPersonId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryPersonId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atribuir pedido");
      }

      toast.success("Pedido atribuído com sucesso!");
      await fetchDeliveryPersonOrders(deliveryPersonId);
      await fetchAvailableOrders();
      fetchOrders(); // Atualizar lista geral de pedidos
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir pedido");
    }
  };

  const handleRemoveOrderFromDeliveryPerson = async (orderId: string, deliveryPersonId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao remover atribuição");
      }

      toast.success("Atribuição removida com sucesso!");
      await fetchDeliveryPersonOrders(deliveryPersonId);
      await fetchAvailableOrders();
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover atribuição");
    }
  };

  const resetZoneForm = () => {
    setZoneForm({
      name: "",
      city: "",
      state: "SP",
      deliveryFee: "",
      active: true,
    });
    setEditingZone(null);
  };

  const handleZoneSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const deliveryFeeNumber = Number(zoneForm.deliveryFee);

    if (!zoneForm.name.trim() || !zoneForm.city.trim()) {
      toast.error("Informe nome e cidade");
      return;
    }

    if (Number.isNaN(deliveryFeeNumber) || deliveryFeeNumber < 0) {
      toast.error("Informe uma taxa de entrega válida");
      return;
    }

    try {
      setIsSavingZone(true);
      const payload = {
        name: zoneForm.name.trim(),
        city: zoneForm.city.trim(),
        state: zoneForm.state.trim() || "SP",
        deliveryFee: deliveryFeeNumber,
        active: zoneForm.active,
      };

      const response = await fetch(
        editingZone ? `/api/admin/delivery-zones/${editingZone.id}` : "/api/admin/delivery-zones",
        {
          method: editingZone ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Erro ao salvar zona de entrega");

      toast.success(editingZone ? "Zona atualizada" : "Zona criada");
      resetZoneForm();
      fetchDeliveryZones();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar zona de entrega");
    } finally {
      setIsSavingZone(false);
    }
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      city: zone.city,
      state: zone.state,
      deliveryFee: zone.deliveryFee.toString(),
      active: zone.active,
    });
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const response = await fetch(`/api/admin/delivery-zones/${zoneId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao remover zona");

      toast.success("Zona removida");
      if (editingZone?.id === zoneId) {
        resetZoneForm();
      }
      fetchDeliveryZones();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover zona de entrega");
    }
  };

  const handleToggleZoneActive = async (zone: DeliveryZone) => {
    try {
      const response = await fetch(`/api/admin/delivery-zones/${zone.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !zone.active }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar zona");

      toast.success("Status atualizado");
      fetchDeliveryZones();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar zona de entrega");
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar status");

      toast.success("Status atualizado com sucesso");
      fetchOrders();
      if (activeTab === "unpaidOrders") {
        fetchUnpaidOrders();
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSendWhatsAppReminder = (order: any) => {
    const now = new Date();
    let message = "";

    if (order.paymentMethod === "BOLETO" && order.boletoInstallments && order.boletoInstallments.length > 0) {
      const firstInstallment = order.boletoInstallments[0];
      const dueDate = new Date(firstInstallment.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue < 0) {
        message = `Olá ${order.customerName}! Lembramos que sua parcela ${firstInstallment.installmentNumber} de R$ ${firstInstallment.amount.toFixed(2)} do pedido #${order.id.slice(0, 8)} já venceu. Por favor, entre em contato para regularizar.`;
      } else if (daysUntilDue <= 3) {
        message = `Olá ${order.customerName}! Lembramos que sua parcela ${firstInstallment.installmentNumber} de R$ ${firstInstallment.amount.toFixed(2)} do pedido #${order.id.slice(0, 8)} vence em ${daysUntilDue} dia(s) (${dueDate.toLocaleDateString("pt-BR")}).`;
      } else {
        message = `Olá ${order.customerName}! Lembramos que sua parcela ${firstInstallment.installmentNumber} de R$ ${firstInstallment.amount.toFixed(2)} do pedido #${order.id.slice(0, 8)} vence em ${dueDate.toLocaleDateString("pt-BR")}.`;
      }
    } else {
      const daysSinceOrder = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const paymentLabel = paymentLabels[order.paymentMethod] || order.paymentMethod;
      
      message = `Olá ${order.customerName}! Lembramos que o pedido #${order.id.slice(0, 8)} no valor de R$ ${order.total.toFixed(2)} (${paymentLabel}) ainda não foi pago. Por favor, entre em contato para regularizar o pagamento.`;
    }

    const phone = order.phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Se não tem permissões ainda (mas está autenticado), mostrar loading
  if (status === "authenticated" && !permissions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Painel Administrativo
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {session?.user?.role === "ADMIN" && "Acesso total ao sistema"}
                  {session?.user?.role === "FINANCIAL" && "Acesso ao fluxo de caixa"}
                  {session?.user?.role === "MANAGEMENT" && "Gerenciamento de entregas e produtos"}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
            </div>
            
            {/* Responsive Navigation Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center">
              <div className="flex overflow-x-auto sm:overflow-visible scrollbar-hide bg-gradient-to-r from-gray-100 to-gray-50 p-1.5 rounded-xl shadow-inner flex-1">
                <div className="flex space-x-2 sm:space-x-3 min-w-full sm:min-w-0 items-center">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
                      activeTab === "dashboard"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </button>
                  {permissions?.canViewOrders && (
                    <>
                  <button
                    onClick={() => setActiveTab("orders")}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === "orders"
                            ? "bg-white text-gray-900 shadow-md"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    Pedidos
                  </button>
                      {permissions?.canViewUnpaidOrders && (
                        <button
                          onClick={() => setActiveTab("unpaidOrders")}
                          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 relative ${
                            activeTab === "unpaidOrders"
                              ? "bg-white text-gray-900 shadow-md"
                              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                          }`}
                        >
                          Não Pagos
                          {unpaidOrdersStats.total > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                              {unpaidOrdersStats.total}
                            </span>
                          )}
                        </button>
                      )}
                    </>
                  )}
                  {permissions?.canViewProducts && (
                  <button
                    onClick={() => setActiveTab("products")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === "products"
                          ? "bg-white text-gray-900 shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    Produtos
                  </button>
                  )}
                  {permissions?.canViewCategories && (
                  <button
                    onClick={() => setActiveTab("categories")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === "categories"
                          ? "bg-white text-gray-900 shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    Categorias
                  </button>
                  )}
                  {permissions?.canViewDeliveryZones && (
                  <button
                    onClick={() => setActiveTab("deliveryZones")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === "deliveryZones"
                          ? "bg-white text-gray-900 shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                      Zonas
                  </button>
                  )}
                  {permissions?.canViewDeliveryPersons && (
                  <button
                      onClick={() => setActiveTab("deliveryPersons")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                        activeTab === "deliveryPersons"
                          ? "bg-white text-gray-900 shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                      }`}
                    >
                      Entregadores
                </button>
              )}
                  {permissions?.canViewUsers && (
                <button
                      onClick={() => setActiveTab("users")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                        activeTab === "users"
                          ? "bg-white text-gray-900 shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                      }`}
                    >
                      Usuários
                </button>
              )}
                  {permissions?.canViewCashFlow && (
              <button
                onClick={() => router.push("/admin/cashflow")}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 text-gray-600 hover:text-gray-900 hover:bg-white/50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Fluxo de Caixa
              </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isLoading && activeTab !== "dashboard" ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : activeTab === "orders" && permissions?.canViewOrders ? (
            // Renderizar conteúdo de pedidos apenas se tiver permissão
            <div className="space-y-4">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">Pedido #{order.id}</h3>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "IN_ROUTE"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {order.status === "PENDING"
                            ? "Pendente"
                            : order.status === "CONFIRMED"
                            ? "Confirmado"
                            : order.status === "IN_ROUTE"
                            ? "Em Rota"
                            : "Entregue"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Cliente</p>
                          <p className="font-medium text-gray-900">{order.user.name}</p>
                          <p className="text-sm text-gray-500">{order.user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Data</p>
                          <p className="font-medium text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Entrega</p>
                          <p className="font-medium text-gray-900">{order.customerName}</p>
                          <p className="text-sm text-gray-500">{order.deliveryCity}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 mt-3 gap-2">
                        <div className="flex items-center gap-2">
                          <span>Total:</span>
                          <span className="font-semibold text-green-600">R$ {order.total.toFixed(2)}</span>
                        </div>
                        <span>Pagamento: {paymentLabels[order.paymentMethod] || order.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      {/* FINANCIAL não pode alterar status de entrega, apenas visualizar */}
                      {permissions?.canAssignDelivery ? (
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="w-full sm:w-48 pl-3 pr-10 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                        >
                          <option value="PENDING">Pendente</option>
                          <option value="CONFIRMED">Confirmado</option>
                          <option value="IN_ROUTE">Em Rota</option>
                          <option value="DELIVERED">Entregue</option>
                        </select>
                      ) : (
                        <div className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600">
                          Status: {order.status === "PENDING" ? "Pendente" : order.status === "CONFIRMED" ? "Confirmado" : order.status === "IN_ROUTE" ? "Em Rota" : "Entregue"}
                        </div>
                      )}
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="w-full sm:w-auto px-4 py-2 text-green-600 hover:text-green-800 font-medium text-center sm:text-left"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : activeTab === "unpaidOrders" && permissions?.canViewUnpaidOrders ? (
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="text-sm text-red-600 font-medium">Vencidos</div>
                  <div className="text-2xl font-bold text-red-700">{unpaidOrdersStats.overdue}</div>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <div className="text-sm text-yellow-600 font-medium">Próximos do Vencimento</div>
                  <div className="text-2xl font-bold text-yellow-700">{unpaidOrdersStats.upcoming}</div>
                </div>
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                  <div className="text-sm text-gray-600 font-medium">Em Aberto</div>
                  <div className="text-2xl font-bold text-gray-700">{unpaidOrdersStats.normal}</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="text-sm text-blue-600 font-medium">Total</div>
                  <div className="text-2xl font-bold text-blue-700">{unpaidOrdersStats.total}</div>
                </div>
              </div>

              {/* Lista de Pedidos Não Pagos */}
              <div className="space-y-4">
                {unpaidOrders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 text-lg">Nenhum pedido não pago encontrado</p>
                  </div>
                ) : (
                  unpaidOrders.map((order) => {
                    const urgencyColor = 
                      order.urgencyLevel === "overdue" ? "bg-red-50 border-red-300" :
                      order.urgencyLevel === "upcoming" ? "bg-yellow-50 border-yellow-300" :
                      "bg-gray-50 border-gray-200";

                    const urgencyBadge = 
                      order.urgencyLevel === "overdue" ? (
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          Vencido
                        </span>
                      ) : order.urgencyLevel === "upcoming" ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          Vence em {order.daysUntilDue} dia(s)
                        </span>
                      ) : null;

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white border-2 ${urgencyColor} rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow`}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <h3 className="text-lg font-semibold text-gray-900">Pedido #{order.id.slice(0, 8)}</h3>
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                order.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "CONFIRMED"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.status === "IN_ROUTE"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {order.status === "PENDING"
                                  ? "Pendente"
                                  : order.status === "CONFIRMED"
                                  ? "Confirmado"
                                  : order.status === "IN_ROUTE"
                                  ? "Em Rota"
                                  : "Entregue"}
                              </span>
                              {urgencyBadge}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Cliente</p>
                                <p className="font-medium text-gray-900">{order.customerName || order.user.name}</p>
                                <p className="text-sm text-gray-500">{order.phone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Data do Pedido</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Vencimento</p>
                                {order.nextDueDate ? (
                                  <>
                                    <p className="font-medium text-gray-900">
                                      {new Date(order.nextDueDate).toLocaleDateString()}
                                    </p>
                                    {order.daysUntilDue !== null && (
                                      <p className={`text-sm ${
                                        order.daysUntilDue < 0 ? "text-red-600" :
                                        order.daysUntilDue <= 3 ? "text-yellow-600" :
                                        "text-gray-500"
                                      }`}>
                                        {order.daysUntilDue < 0 
                                          ? `${Math.abs(order.daysUntilDue)} dia(s) atrasado`
                                          : `${order.daysUntilDue} dia(s) restante(s)`
                                        }
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-500">Sem data definida</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 mt-3 gap-2">
                              <div className="flex items-center gap-2">
                                <span>Total:</span>
                                <span className="font-semibold text-green-600">R$ {order.total.toFixed(2)}</span>
                              </div>
                              <span>Pagamento: {paymentLabels[order.paymentMethod] || order.paymentMethod}</span>
                            </div>

                            {order.paymentMethod === "BOLETO" && order.boletoInstallments && order.boletoInstallments.length > 0 && (
                              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">Parcelas Pendentes:</p>
                                <div className="space-y-1">
                                  {order.boletoInstallments.slice(0, 3).map((inst: any) => {
                                    const instDueDate = new Date(inst.dueDate);
                                    const instDaysUntilDue = Math.ceil((instDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                      <div key={inst.id} className="text-xs text-gray-600">
                                        Parcela {inst.installmentNumber}: R$ {inst.amount.toFixed(2)} - 
                                        Vence em {instDueDate.toLocaleDateString("pt-BR")}
                                        {instDaysUntilDue < 0 && <span className="text-red-600 ml-1">(Vencida)</span>}
                                        {instDaysUntilDue >= 0 && instDaysUntilDue <= 3 && <span className="text-yellow-600 ml-1">(Próxima)</span>}
                                      </div>
                                    );
                                  })}
                                  {order.boletoInstallments.length > 3 && (
                                    <div className="text-xs text-gray-500">
                                      + {order.boletoInstallments.length - 3} parcela(s) mais
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleSendWhatsAppReminder(order)}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                Enviar Lembrete
                              </button>
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                              >
                                <option value="PENDING">Pendente</option>
                                <option value="CONFIRMED">Confirmado</option>
                                <option value="IN_ROUTE">Em Rota</option>
                                <option value="DELIVERED">Entregue</option>
                              </select>
                            </div>
                            <button
                              onClick={() => router.push(`/admin/orders/${order.id}`)}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                              Ver Detalhes
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeTab === "categories" && permissions?.canViewCategories ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Gerenciamento de categorias</p>
              <button
                onClick={() => router.push("/admin/categories")}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Abrir Gerenciador de Categorias
              </button>
            </div>
          ) : activeTab === "products" && permissions?.canViewProducts ? (
            <div className="space-y-6">
              {permissions?.canCreateProducts && (
                <div className="flex justify-end">
                  <button
                    onClick={() => router.push("/admin/products/new")}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Novo Produto
                  </button>
                </div>
              )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Se a imagem falhar, tenta usar a imagem padrão
                        if (!target.src.includes('/image.jpg')) {
                          target.src = '/image.jpg';
                        }
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                    <p className="text-gray-600 mt-1">R$ {product.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-1">Estoque: {product.stock}</p>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => router.push(`/admin/products/${product.id}`)}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </div>
          ) : activeTab === "deliveryZones" && permissions?.canViewDeliveryZones ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm lg:col-span-1">
                <h3 className="text-lg font-semibold mb-4">
                  {editingZone ? "Editar Zona de Entrega" : "Nova Zona de Entrega"}
                </h3>
                <form onSubmit={handleZoneSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      type="text"
                      value={zoneForm.name}
                      onChange={(event) => setZoneForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Ex: Zona Centro"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                    <input
                      type="text"
                      value={zoneForm.city}
                      onChange={(event) => setZoneForm((prev) => ({ ...prev, city: event.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Ribeirão Preto"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <input
                        type="text"
                        value={zoneForm.state}
                        maxLength={2}
                        onChange={(event) => setZoneForm((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Taxa de Entrega</label>
                      <input
                        type="number"
                        step="0.01"
                        value={zoneForm.deliveryFee}
                        onChange={(event) => setZoneForm((prev) => ({ ...prev, deliveryFee: event.target.value }))}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={zoneForm.active}
                        onChange={(event) => setZoneForm((prev) => ({ ...prev, active: event.target.checked }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Ativa
                    </label>
                    {editingZone && (
                      <button
                        type="button"
                        onClick={resetZoneForm}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancelar edição
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingZone}
                    className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
                  >
                    {isSavingZone ? "Salvando..." : editingZone ? "Atualizar Zona" : "Adicionar Zona"}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-lg font-semibold">Zonas cadastradas</h3>
                  <p className="text-sm text-gray-500">Configure cidades atendidas na região de Ribeirão Preto</p>
                </div>

                <div className="space-y-4">
                  {deliveryZones.length === 0 ? (
                    <p className="text-gray-500">Nenhuma zona cadastrada até o momento.</p>
                  ) : (
                    deliveryZones.map((zone) => (
                      <div
                        key={zone.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-200 rounded-xl p-4"
                      >
                        <div>
                          <p className="text-gray-900 font-semibold">{zone.name}</p>
                          <p className="text-sm text-gray-600">
                            {zone.city}/{zone.state} • Taxa: R$ {zone.deliveryFee.toFixed(2)}
                          </p>
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full mt-2 ${
                              zone.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {zone.active ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleZoneActive(zone)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            {zone.active ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => handleEditZone(zone)}
                            className="px-3 py-1 text-sm text-green-600 hover:text-green-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "dashboard" ? (
            <DashboardTab permissions={permissions} router={router} />
          ) : activeTab === "users" && permissions?.canViewUsers ? (
            <UsersTab
              users={users}
              userForm={userForm}
              setUserForm={setUserForm}
              editingUser={editingUser}
              isSavingUser={isSavingUser}
              handleCreateUser={handleCreateUser}
              handleUpdateUser={handleUpdateUser}
              handleEditUser={handleEditUser}
              resetUserForm={resetUserForm}
              session={session}
            />
          ) : activeTab === "deliveryPersons" && permissions?.canViewDeliveryPersons ? (
            <div className="space-y-6">
              {selectedDeliveryPerson ? (
                // Visualização de pedidos do entregador selecionado
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => {
                          setSelectedDeliveryPerson(null);
                          setDeliveryPersonOrders(null);
                        }}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar para lista de entregadores
                      </button>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {deliveryPersonOrders?.deliveryPerson?.name}
                      </h2>
                      <p className="text-gray-600">{deliveryPersonOrders?.deliveryPerson?.email}</p>
                    </div>
                  </div>

                  {/* Atribuir Novo Pedido */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-blue-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Atribuir Novo Pedido</h3>
                    {isLoadingOrders ? (
                      <p className="text-gray-500">Carregando pedidos disponíveis...</p>
                    ) : availableOrders.length === 0 ? (
                      <p className="text-gray-500">Nenhum pedido confirmado disponível para atribuição.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {availableOrders.map((order: any) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                Pedido #{order.id.slice(0, 8)} - {order.customerName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.deliveryCity} • R$ {order.total.toFixed(2)} • {order.items.length} item(s)
                              </p>
                            </div>
                            <button
                              onClick={() => handleAssignOrderToDeliveryPerson(order.id, selectedDeliveryPerson)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Atribuir
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Itinerário do Entregador */}
                  {isLoadingOrders ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Pedidos Confirmados - Itinerário */}
                      {deliveryPersonOrders?.itinerary?.confirmed?.length > 0 && (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                          <h3 className="text-lg font-semibold mb-4 text-blue-600 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Pedidos Confirmados ({deliveryPersonOrders.itinerary.confirmed.length})
                          </h3>
                          <div className="space-y-4">
                            {deliveryPersonOrders.itinerary.confirmed.map((order: any, index: number) => (
                              <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                                        #{index + 1}
                                      </span>
                                      <span className="text-lg font-bold text-gray-900">
                                        Pedido #{order.id.slice(0, 8)}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 font-medium">{order.customerName}</p>
                                    <p className="text-sm text-gray-600">{order.phone}</p>
                                    <p className="text-sm text-gray-600">
                                      {order.deliveryAddress}, {order.deliveryNumber} - {order.deliveryNeighborhood}, {order.deliveryCity}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveOrderFromDeliveryPerson(order.id, selectedDeliveryPerson)}
                                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
                                  >
                                    Remover
                                  </button>
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                  <p className="text-sm font-semibold text-gray-700 mb-2">Produtos/Cestas:</p>
                                  <div className="space-y-2">
                                    {order.items.map((item: any) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-200"
                                      >
                                        <div className="flex items-center gap-2 flex-1">
                                          <img
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="w-10 h-10 object-cover rounded"
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              // Se a imagem falhar, tenta usar a imagem padrão
                                              if (!target.src.includes('/image.jpg')) {
                                                target.src = '/image.jpg';
                                              }
                                            }}
                                          />
                                          <span className="text-sm font-medium text-gray-900">{item.product.name}</span>
                                        </div>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                          {item.quantity}x
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-200">
                                    <span className="text-sm text-gray-600">Total:</span>
                                    <span className="text-lg font-bold text-green-600">R$ {order.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pedidos Em Rota */}
                      {deliveryPersonOrders?.itinerary?.inRoute?.length > 0 && (
                        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                          <h3 className="text-lg font-semibold mb-4 text-orange-600 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Em Rota ({deliveryPersonOrders.itinerary.inRoute.length})
                          </h3>
                          <div className="space-y-4">
                            {deliveryPersonOrders.itinerary.inRoute.map((order: any) => (
                              <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border-2 border-orange-200 rounded-xl p-4 bg-orange-50"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <span className="text-lg font-bold text-gray-900">
                                      Pedido #{order.id.slice(0, 8)}
                                    </span>
                                    <p className="text-gray-700 font-medium">{order.customerName}</p>
                                    <p className="text-sm text-gray-600">{order.deliveryAddress}, {order.deliveryCity}</p>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-orange-200">
                                  <p className="text-sm font-semibold text-gray-700 mb-2">Produtos:</p>
                                  <div className="space-y-2">
                                    {order.items.map((item: any) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between bg-white rounded-lg p-2"
                                      >
                                        <span className="text-sm text-gray-900">{item.product.name}</span>
                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                                          {item.quantity}x
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pedidos Entregues (últimos) */}
                      {deliveryPersonOrders?.itinerary?.delivered?.length > 0 && (
                        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                          <h3 className="text-lg font-semibold mb-4 text-green-600">
                            Entregues Recentes ({deliveryPersonOrders.itinerary.delivered.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {deliveryPersonOrders.itinerary.delivered.slice(0, 6).map((order: any) => (
                              <div
                                key={order.id}
                                className="border border-green-200 rounded-lg p-3 bg-green-50"
                              >
                                <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-600">{order.customerName}</p>
                                <p className="text-sm font-semibold text-green-600">R$ {order.total.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!deliveryPersonOrders?.itinerary?.confirmed?.length && 
                        !deliveryPersonOrders?.itinerary?.inRoute?.length && 
                        !deliveryPersonOrders?.itinerary?.delivered?.length) && (
                        <div className="text-center py-12 bg-white rounded-xl">
                          <p className="text-gray-500">Este entregador ainda não tem pedidos atribuídos.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Lista de entregadores
                <>
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Adicionar Novo Entregador</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Digite o email de um usuário cadastrado para transformá-lo em entregador. O usuário deve já estar registrado no sistema.
                    </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
                        handleAddDeliveryPerson(email);
                    form.reset();
                  }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <input
                    type="email"
                    name="email"
                        placeholder="Email do usuário para tornar entregador"
                    required
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                        Adicionar Entregador
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Entregadores Cadastrados</h3>
                <div className="space-y-4">
                      {deliveryPersons.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Nenhum entregador cadastrado até o momento.</p>
                        </div>
                      ) : (
                        deliveryPersons.map((person) => (
                          <motion.div
                            key={person.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4 border border-gray-200"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{person.name}</p>
                              <p className="text-sm text-gray-500">{person.email}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-600">
                                  Cadastrado em: {new Date(person.createdAt).toLocaleDateString("pt-BR")}
                                </span>
                                {person._count?.deliveryOrders > 0 && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                                    {person._count.deliveryOrders} entrega(s) em andamento
                                  </span>
                                )}
                      </div>
                            </div>
                            <div className="flex gap-2">
                        <button
                                onClick={() => handleViewDeliveryPersonOrders(person.id)}
                                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                Ver Pedidos
                              </button>
                              <button
                                onClick={() => handleRemoveDeliveryPerson(person.id)}
                                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Remover
                        </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                </div>
                </>
              )}
              </div>
          ) : !permissions ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando permissões...</p>
            </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 max-w-md">
                <svg className="w-16 h-16 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h3>
                <p className="text-gray-600">
                  Você não tem permissão para acessar esta seção. Entre em contato com um administrador.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 