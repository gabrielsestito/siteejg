"use client";

import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Navigation } from "@/components/Navigation";
import { Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  state: string;
  deliveryFee: number;
}

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [isZonesLoading, setIsZonesLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    name: "",
    phone: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    zoneId: "",
    paymentMethod: "PIX",
  });

  useEffect(() => {
    if (session?.user?.name) {
      setCheckoutData((prev) => ({ ...prev, name: prev.name || session.user.name || "" }));
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (session) {
      fetchCart();
      fetchDeliveryZones();
    }
  }, [session]);

  async function fetchCart() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cart");
      if (!response.ok) throw new Error("Erro ao buscar carrinho");
      const data = await response.json();
      setCart(data.cart?.items || []);
    } catch (error) {
      console.error("Erro ao buscar carrinho:", error);
      toast.error("Erro ao carregar carrinho");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) throw new Error("Erro ao remover item");

      toast.success("Item removido do carrinho");
      await fetchCart();
    } catch (error) {
      console.error("Erro ao remover item:", error);
      toast.error("Erro ao remover item do carrinho");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchDeliveryZones() {
    try {
      setIsZonesLoading(true);
      const response = await fetch("/api/delivery-zones");
      if (!response.ok) throw new Error("Erro ao carregar cidades disponíveis");
      const data = await response.json();
      setDeliveryZones(data.zones || []);
    } catch (error) {
      console.error("Erro ao buscar zonas de entrega:", error);
      toast.error("Erro ao carregar cidades de entrega");
    } finally {
      setIsZonesLoading(false);
    }
  }

  const selectedZone = useMemo(
    () => deliveryZones.find((zone) => zone.id === checkoutData.zoneId) || null,
    [deliveryZones, checkoutData.zoneId]
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const deliveryFee = selectedZone?.deliveryFee ?? 0;

  const total = subtotal + deliveryFee;

  const paymentLabels: Record<string, string> = {
    PIX: "PIX",
    CREDIT_CARD: "Cartão de Crédito",
    DEBIT_CARD: "Cartão de Débito",
    CASH: "Dinheiro",
    BOLETO: "Boleto",
  };

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setCheckoutData((prev) => ({ ...prev, [name]: value }));
  }

  function validateCheckout() {
    if (!checkoutData.name.trim()) {
      toast.error("Informe o nome para a entrega");
      return false;
    }

    if (!checkoutData.phone.trim()) {
      toast.error("Informe um telefone de contato");
      return false;
    }

    if (!checkoutData.address.trim() || !checkoutData.number.trim()) {
      toast.error("Informe o endereço completo");
      return false;
    }

    if (!checkoutData.neighborhood.trim()) {
      toast.error("Informe o bairro");
      return false;
    }

    if (!checkoutData.zoneId) {
      toast.error("Selecione a cidade de entrega");
      return false;
    }

    return true;
  }

  async function handleCheckout() {
    if (!session) {
      router.push("/login");
      return;
    }

    if (!validateCheckout()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          customerName: checkoutData.name,
          phone: checkoutData.phone,
          deliveryAddress: checkoutData.address,
          deliveryNumber: checkoutData.number,
          deliveryComplement: checkoutData.complement || undefined,
          deliveryNeighborhood: checkoutData.neighborhood,
          deliveryZoneId: checkoutData.zoneId,
          paymentMethod: checkoutData.paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar pedido");
      }

      const data = await response.json();
      const order = data;

      // Criar mensagem para o WhatsApp
      const addressLine = `${checkoutData.address}, ${checkoutData.number}${
        checkoutData.complement ? ` - ${checkoutData.complement}` : ""
      }`;

      const message = `Olá! Meu nome é ${checkoutData.name} e gostaria de confirmar meu pedido.\n\nPedido #${order.id}\n\nDados para Entrega:\nNome: ${checkoutData.name}\nTelefone: ${checkoutData.phone}\nEndereço: ${addressLine}\nBairro: ${checkoutData.neighborhood}\nCidade: ${selectedZone?.city}/${selectedZone?.state ?? "SP"}\n\nItens:\n${cart
        .map(
          (item) =>
            `${item.product.name} - ${item.quantity}x - R$ ${(item.product.price * item.quantity).toFixed(2)}`
        )
        .join("\n")}\n\nSubtotal: R$ ${subtotal.toFixed(2)}\nEntrega: R$ ${deliveryFee.toFixed(
        2
      )}\nTotal: R$ ${total.toFixed(2)}\n\nForma de Pagamento: ${
        paymentLabels[checkoutData.paymentMethod]
      }`;

      // Redirecionar para o WhatsApp com o número específico
      const whatsappUrl = `https://wa.me/5516992025527?text=${encodeURIComponent(message)}`;
      
      // Primeiro mostra a mensagem de sucesso
      toast.success("Pedido criado com sucesso! Você será redirecionado para o WhatsApp.");
      
      // Depois redireciona para o WhatsApp
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        
        // Por último redireciona para a página de pedidos
        setTimeout(() => {
          router.push("/orders");
        }, 1000);
      }, 1000);

    } catch (error: any) {
      console.error("Erro ao finalizar compra:", error);
      toast.error(error.message || "Erro ao finalizar compra");
    } finally {
      setIsLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              Você precisa estar logado para ver seu carrinho
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/products")}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Seu Carrinho</h1>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl mb-4">Seu carrinho está vazio</p>
            <button
              onClick={() => router.push("/products")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ver Produtos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl"
                >
                  <div className="flex items-center gap-6">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-xl"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Se a imagem falhar, tenta usar a imagem padrão
                        if (!target.src.includes('/image.jpg')) {
                          target.src = '/image.jpg';
                        }
                      }}
                    />
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.product.name}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        Quantidade: {item.quantity}
                      </p>
                      <p className="text-green-600 font-semibold mt-2">
                        R$ {(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Dados para Entrega</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input
                      type="text"
                      name="name"
                      value={checkoutData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nome do responsável pela entrega"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={checkoutData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="(16) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Endereço</label>
                    <input
                      type="text"
                      name="address"
                      value={checkoutData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Rua, avenida..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Número</label>
                      <input
                        type="text"
                        name="number"
                        value={checkoutData.number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Complemento</label>
                      <input
                        type="text"
                        name="complement"
                        value={checkoutData.complement}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Apartamento, bloco..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Bairro</label>
                    <input
                      type="text"
                      name="neighborhood"
                      value={checkoutData.neighborhood}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Bairro"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                    <select
                      name="zoneId"
                      value={checkoutData.zoneId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      disabled={isZonesLoading}
                    >
                      <option value="">Selecione uma cidade</option>
                      {deliveryZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.city} - R$ {zone.deliveryFee.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                    <select
                      name="paymentMethod"
                      value={checkoutData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="PIX">PIX</option>
                      <option value="CREDIT_CARD">Cartão de Crédito</option>
                      <option value="DEBIT_CARD">Cartão de Débito</option>
                      <option value="CASH">Dinheiro</option>
                    </select>
                  </div>

                  <div className="border-t pt-4 mt-4 space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxa de entrega</span>
                      <span>R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold text-lg"
                  >
                    {isLoading ? "Finalizando..." : "Finalizar Compra"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 