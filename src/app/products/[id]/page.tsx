"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Navigation } from "@/components/Navigation";
import { ArrowLeft, ShoppingCart, Package } from "lucide-react";
import { ProductImageWithFallback } from "@/components/ProductImageWithFallback";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (!response.ok) throw new Error("Erro ao carregar produto");
      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      toast.error("Erro ao carregar produto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao adicionar ao carrinho");
      }

      toast.success("Produto adicionado ao carrinho com sucesso!");
      router.push("/cart");
    } catch (error: any) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast.error(error.message || "Erro ao adicionar ao carrinho");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-600">
          Produto não encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/products")}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Detalhes do Produto</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="relative bg-gray-100 rounded-xl overflow-hidden">
              <ProductImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-[400px] object-cover rounded-xl shadow-md"
                loading="lazy"
              />
              <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {product.stock} unidades disponíveis
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h2>
                <p className="text-2xl font-bold text-green-600">
                  R$ {product.price.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">Descrição</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label htmlFor="quantity" className="text-gray-700 font-medium">
                    Quantidade:
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Adicionar ao Carrinho
                </button>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Package className="w-5 h-5" />
                <span>Entrega em até 3 dias úteis</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 