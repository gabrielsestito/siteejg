"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Navigation } from "@/components/Navigation";

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
  boletoInstallments?: Array<{
    id: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paidAt: string | null;
  }>;
  items: OrderItem[];
  files: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const paymentLabels: Record<Order["paymentMethod"], string> = {
    PIX: "PIX",
    CREDIT_CARD: "Cartão de Crédito",
    DEBIT_CARD: "Cartão de Débito",
    CASH: "Dinheiro",
    BOLETO: "Boleto",
  };

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session]);

  async function fetchOrders() {
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) throw new Error("Erro ao buscar pedidos");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setIsLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              Você precisa estar logado para ver seus pedidos
            </h2>
            <button
              onClick={() => router.push("/login")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Fazer Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-xl">Carregando pedidos...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>

        {orders.length === 0 ? (
          <div className="text-center">
            <p className="text-xl mb-4">Você ainda não fez nenhum pedido</p>
            <button
              onClick={() => router.push("/products")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ver Produtos
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Pedido #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-gray-600">
                      Data: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "CONFIRMED"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "IN_ROUTE"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {order.status === "PENDING"
                      ? "Pendente"
                      : order.status === "CONFIRMED"
                      ? "Confirmado"
                      : order.status === "IN_ROUTE"
                      ? "Em Rota"
                      : "Entregue"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <h4 className="font-semibold mb-2">Entrega</h4>
                    <p className="text-gray-700">{order.customerName}</p>
                    <p className="text-gray-600">{order.phone}</p>
                    <p className="text-gray-600">
                      {order.deliveryAddress}, {order.deliveryNumber}
                      {order.deliveryComplement ? ` - ${order.deliveryComplement}` : ""}
                    </p>
                    <p className="text-gray-600">Bairro {order.deliveryNeighborhood}</p>
                    <p className="text-gray-600">
                      {order.deliveryCity}
                      {order.deliveryState ? `/${order.deliveryState}` : ""}
                    </p>
                    {order.deliveryDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        Entrega prevista: {new Date(order.deliveryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Pagamento</h4>
                    <p className="text-gray-700">{paymentLabels[order.paymentMethod]}</p>
                    <div className="mt-3 space-y-2 text-gray-700">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>R$ {order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entrega</span>
                        <span>R$ {order.deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>R$ {order.total.toFixed(2)}</span>
                      </div>
                      {order.paymentMethod === "BOLETO" && order.boletoInstallments && order.boletoInstallments.length > 0 && (
                        <div className="text-sm text-gray-500 mt-2 space-y-1">
                          {order.boletoInstallments.map((installment) => (
                            <p key={installment.id}>
                              Parcela {installment.installmentNumber}: R$ {installment.amount.toFixed(2)} - Vencimento: {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                              {installment.paidAt && (
                                <span className="text-green-600 ml-2">✓ Pago</span>
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded mr-3"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Se a imagem falhar, tenta usar a imagem padrão
                              if (!target.src.includes('/image.jpg')) {
                                target.src = '/image.jpg';
                              }
                            }}
                          />
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity}x - R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {order.files && order.files.length > 0 ? (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-2">Documentos</h4>
                    <div className="space-y-2">
                      {order.files.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 bg-gray-50 rounded-xl p-4"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-2">Documentos</h4>
                    <div className="space-y-2">
                      <p className="text-gray-500 text-center py-4">Nenhum documento anexado</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 