"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Navigation } from "@/components/Navigation";
import { ProductImageWithFallback } from "@/components/ProductImageWithFallback";
import {
  MapPin,
  Phone,
  Package,
  CheckCircle,
  Navigation as NavigationIcon,
  Clock,
  User,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react";

interface Order {
  id: string;
  status: string;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  deliveryNumber: string;
  deliveryComplement?: string | null;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryState?: string | null;
  total: number;
  createdAt: string;
  notes?: string | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      image: string;
    };
  }>;
}

export default function DeliveryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [itinerary, setItinerary] = useState<string[]>([]); // Array de IDs na ordem do itinerário

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "DELIVERY") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "DELIVERY") {
      fetchOrders();
    }
  }, [status, session, filterStatus, filterDate]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterDate && filterStatus === "DELIVERED") params.append("date", filterDate);
      
      const response = await fetch(`/api/delivery/orders?${params.toString()}`);
      if (!response.ok) throw new Error("Erro ao buscar corridas");
      const data = await response.json();
      setOrders(data.orders || []);
      
      // Inicializar itinerário se não existir
      if (itinerary.length === 0 && data.orders.length > 0) {
        const confirmedOrders = data.orders
          .filter((o: Order) => o.status === "CONFIRMED")
          .map((o: Order) => o.id);
        setItinerary(confirmedOrders);
      }
    } catch (error) {
      toast.error("Erro ao carregar corridas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRoute = async (orderId: string) => {
    try {
      const response = await fetch(`/api/delivery/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start_route" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao iniciar rota");
      }

      toast.success("Rota iniciada com sucesso!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar rota");
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const response = await fetch(`/api/delivery/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "confirm_delivery" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao confirmar entrega");
      }

      toast.success("Entrega confirmada com sucesso!");
      fetchOrders();
      // Remover do itinerário
      setItinerary(itinerary.filter((id) => id !== orderId));
    } catch (error: any) {
      toast.error(error.message || "Erro ao confirmar entrega");
    }
  };

  const openMaps = (order: Order) => {
    const address = `${order.deliveryAddress}, ${order.deliveryNumber}${
      order.deliveryComplement ? ` - ${order.deliveryComplement}` : ""
    }, ${order.deliveryNeighborhood}, ${order.deliveryCity}${
      order.deliveryState ? ` - ${order.deliveryState}` : ""
    }`;
    const encodedAddress = encodeURIComponent(address);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank"
    );
  };

  const moveInItinerary = (orderId: string, direction: "up" | "down") => {
    const currentIndex = itinerary.indexOf(orderId);
    if (currentIndex === -1) return;

    const newItinerary = [...itinerary];
    if (direction === "up" && currentIndex > 0) {
      [newItinerary[currentIndex - 1], newItinerary[currentIndex]] = [
        newItinerary[currentIndex],
        newItinerary[currentIndex - 1],
      ];
    } else if (direction === "down" && currentIndex < newItinerary.length - 1) {
      [newItinerary[currentIndex], newItinerary[currentIndex + 1]] = [
        newItinerary[currentIndex + 1],
        newItinerary[currentIndex],
      ];
    }
    setItinerary(newItinerary);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "IN_ROUTE":
        return "bg-yellow-100 text-yellow-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmado";
      case "IN_ROUTE":
        return "Em Rota";
      case "DELIVERED":
        return "Entregue";
      default:
        return status;
    }
  };

  // Separar pedidos por status
  const confirmedOrders = orders.filter((o) => o.status === "CONFIRMED");
  const inRouteOrders = orders.filter((o) => o.status === "IN_ROUTE");
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");

  // Ordenar pedidos confirmados pelo itinerário
  const sortedConfirmedOrders = [...confirmedOrders].sort((a, b) => {
    const indexA = itinerary.indexOf(a.id);
    const indexB = itinerary.indexOf(b.id);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel do Entregador</h1>
          <p className="text-gray-600">Gerencie suas corridas e entregas</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilterStatus("");
                  setFilterDate("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === ""
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => {
                  setFilterStatus("CONFIRMED");
                  setFilterDate("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "CONFIRMED"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Confirmadas ({confirmedOrders.length})
              </button>
              <button
                onClick={() => {
                  setFilterStatus("IN_ROUTE");
                  setFilterDate("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "IN_ROUTE"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Em Rota ({inRouteOrders.length})
              </button>
              <button
                onClick={() => {
                  setFilterStatus("DELIVERED");
                  setFilterDate("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "DELIVERED"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Entregues ({deliveredOrders.length})
              </button>
            </div>
            {filterStatus === "DELIVERED" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Filtrar por data:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pedidos Confirmados - Itinerário */}
            {sortedConfirmedOrders.length > 0 && filterStatus !== "IN_ROUTE" && filterStatus !== "DELIVERED" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="w-6 h-6 text-blue-600" />
                    Pedidos Confirmados - Itinerário
                  </h2>
                  <span className="text-sm text-gray-500">
                    {sortedConfirmedOrders.length} pedido(s)
                  </span>
                </div>
                <div className="space-y-4">
                  {sortedConfirmedOrders.map((order, index) => {
                    const itineraryIndex = itinerary.indexOf(order.id);
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
                      >
                        <div className="flex flex-col lg:flex-row gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl font-bold text-gray-800">
                                    #{order.id.slice(0, 8)}
                                  </span>
                                  <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                      order.status
                                    )}`}
                                  >
                                    {getStatusLabel(order.status)}
                                  </span>
                                  {itineraryIndex !== -1 && (
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                      #{itineraryIndex + 1} no itinerário
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                  <div className="flex items-start gap-2">
                                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                      <p className="text-sm text-gray-600">Cliente</p>
                                      <p className="font-medium text-gray-900">{order.customerName}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                      <p className="text-sm text-gray-600">Telefone</p>
                                      <p className="font-medium text-gray-900">{order.phone}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2 md:col-span-2">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-600">Endereço</p>
                                      <p className="font-medium text-gray-900">
                                        {order.deliveryAddress}, {order.deliveryNumber}
                                        {order.deliveryComplement && ` - ${order.deliveryComplement}`}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {order.deliveryNeighborhood}, {order.deliveryCity}
                                        {order.deliveryState && ` - ${order.deliveryState}`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {/* Produtos do Pedido */}
                                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Produtos do Pedido ({order.items.length} item{order.items.length !== 1 ? 's' : ''})
                                  </p>
                                  <div className="space-y-2">
                                    {order.items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                                      >
                                        <div className="flex items-center gap-3 flex-1">
                                          <ProductImageWithFallback
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="w-12 h-12 object-cover rounded-lg"
                                            loading="lazy"
                                          />
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-900 text-sm">
                                              {item.product.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              R$ {item.price.toFixed(2)} cada
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                            {item.quantity}x
                                          </span>
                                          <span className="text-sm font-semibold text-gray-900">
                                            R$ {(item.quantity * item.price).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">Total do Pedido:</span>
                                    <span className="text-lg font-bold text-green-600">
                                      R$ {order.total.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                {/* Observação do Pedido */}
                                {order.notes && order.notes.trim() !== '' && (
                                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                      <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-amber-800 mb-1">Observação do Pedido:</p>
                                        <p className="text-sm text-amber-900 whitespace-pre-wrap">{order.notes}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 lg:w-64">
                            {itineraryIndex !== -1 && (
                              <div className="flex gap-2 mb-2">
                                <button
                                  onClick={() => moveInItinerary(order.id, "up")}
                                  disabled={itineraryIndex === 0}
                                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                  Subir
                                </button>
                                <button
                                  onClick={() => moveInItinerary(order.id, "down")}
                                  disabled={itineraryIndex === itinerary.length - 1}
                                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                  Descer
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => openMaps(order)}
                              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                            <NavigationIcon className="w-5 h-5" />
                            Abrir no Maps
                          </button>
                          <button
                            onClick={() => handleStartRoute(order.id)}
                            className="w-full px-4 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 font-medium"
                          >
                            <NavigationIcon className="w-5 h-5" />
                            Iniciar Rota
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pedidos Em Rota */}
            {inRouteOrders.length > 0 && filterStatus !== "CONFIRMED" && filterStatus !== "DELIVERED" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <NavigationIcon className="w-6 h-6 text-yellow-600" />
                    Em Rota
                  </h2>
                  <span className="text-sm text-gray-500">
                    {inRouteOrders.length} pedido(s)
                  </span>
                </div>
                <div className="space-y-4">
                  {inRouteOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500"
                    >
                      <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl font-bold text-gray-800">
                                  #{order.id.slice(0, 8)}
                                </span>
                                <span
                                  className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="flex items-start gap-2">
                                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                  <div>
                                    <p className="text-sm text-gray-600">Cliente</p>
                                    <p className="font-medium text-gray-900">{order.customerName}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                  <div>
                                    <p className="text-sm text-gray-600">Telefone</p>
                                    <p className="font-medium text-gray-900">{order.phone}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 md:col-span-2">
                                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-600">Endereço</p>
                                    <p className="font-medium text-gray-900">
                                      {order.deliveryAddress}, {order.deliveryNumber}
                                      {order.deliveryComplement && ` - ${order.deliveryComplement}`}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {order.deliveryNeighborhood}, {order.deliveryCity}
                                      {order.deliveryState && ` - ${order.deliveryState}`}
                                    </p>
                                  </div>
                                </div>
                                {/* Produtos do Pedido */}
                                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Produtos do Pedido ({order.items.length} item{order.items.length !== 1 ? 's' : ''})
                                  </p>
                                  <div className="space-y-2">
                                    {order.items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                                      >
                                        <div className="flex items-center gap-3 flex-1">
                                          <ProductImageWithFallback
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="w-12 h-12 object-cover rounded-lg"
                                            loading="lazy"
                                          />
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-900 text-sm">
                                              {item.product.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              R$ {item.price.toFixed(2)} cada
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                            {item.quantity}x
                                          </span>
                                          <span className="text-sm font-semibold text-gray-900">
                                            R$ {(item.quantity * item.price).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">Total do Pedido:</span>
                                    <span className="text-lg font-bold text-green-600">
                                      R$ {order.total.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                {/* Observação do Pedido */}
                                {order.notes && order.notes.trim() !== '' && (
                                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                      <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-amber-800 mb-1">Observação do Pedido:</p>
                                        <p className="text-sm text-amber-900 whitespace-pre-wrap">{order.notes}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 lg:w-64">
                          <button
                            onClick={() => openMaps(order)}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                          >
                            <NavigationIcon className="w-5 h-5" />
                            Abrir no Maps
                          </button>
                          <button
                            onClick={() => handleConfirmDelivery(order.id)}
                            className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Confirmar Entrega
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Pedidos Entregues */}
            {deliveredOrders.length > 0 && filterStatus !== "CONFIRMED" && filterStatus !== "IN_ROUTE" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Entregues
                  </h2>
                  <span className="text-sm text-gray-500">
                    {deliveredOrders.length} pedido(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliveredOrders.slice(0, 10).map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-gray-800">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{order.customerName}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        {order.deliveryCity}
                      </p>
                      {order.notes && order.notes.trim() !== '' && (
                        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                          <div className="flex items-start gap-1">
                            <FileText className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-amber-900 line-clamp-2">{order.notes}</p>
                          </div>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-green-600">
                        R$ {order.total.toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {orders.length === 0 && !isLoading && (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhuma corrida encontrada</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

