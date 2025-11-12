'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Product } from '@prisma/client';
import { ShoppingBag, Truck, Shield, Star, ChevronRight } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { ProductImageWithFallback } from '@/components/ProductImageWithFallback';

// Loading state component for featured products
const ProductSkeleton = () => (
  <div className="w-full p-4 space-y-4">
    <Skeleton className="h-48 w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-1/4" />
  </div>
);

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('/api/products/featured');
        const data = await response.json();
        setFeaturedProducts(data.products);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <>
      <Navigation />
      {/* Hero Section - Full Width Banner */}
      <section className="relative w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full"
          style={{ aspectRatio: '1489/551' }}
        >
          <img
            src="/hero-banner.jpg"
            alt="EJG Cestas Básicas - Qualidade e variedade para sua família"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </section>
      <main className="min-h-screen">

        {/* Features Section */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Por que escolher a EJG?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprometidos com a qualidade e satisfação dos nossos clientes
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Qualidade Garantida',
                  description: 'Produtos selecionados com rigoroso controle de qualidade',
                  icon: <Shield className="w-12 h-12 text-green-600" />
                },
                {
                  title: 'Entrega Rápida',
                  description: 'Entregamos em toda a região com agilidade',
                  icon: <Truck className="w-12 h-12 text-green-600" />
                },
                {
                  title: 'Melhor Preço',
                  description: 'Preços justos e competitivos para você',
                  icon: <ShoppingBag className="w-12 h-12 text-green-600" />
                },
                {
                  title: 'Satisfação Garantida',
                  description: 'Compromisso com a satisfação dos nossos clientes',
                  icon: <Star className="w-12 h-12 text-green-600" />
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-100 group"
                >
                  <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  Produtos em Destaque
                </h2>
                <p className="text-gray-600 text-lg">Os produtos mais procurados pelos nossos clientes</p>
              </motion.div>
              <Link href="/products">
                <Button variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50 group font-semibold">
                  Ver todos os produtos
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {isLoading
                ? Array(3).fill(null).map((_, index) => <ProductSkeleton key={index} />)
                : featuredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.15 }}
                      viewport={{ once: true }}
                      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 overflow-hidden border border-gray-100 group"
                    >
                      <div className="relative h-64 overflow-hidden">
                        <ProductImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-6">
                        <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-green-600 transition-colors">{product.name}</h3>
                        <p className="text-gray-600 mb-6 text-base line-clamp-2 leading-relaxed">{product.description}</p>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <p className="text-3xl font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(Number(product.price))}
                          </p>
                          <Link href={`/products/${product.id}`}>
                            <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg w-full sm:w-auto">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                O que nossos clientes dizem
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                A satisfação dos nossos clientes é a nossa maior recompensa
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Maria Silva",
                  role: "Cliente desde 2020",
                  content: "Excelente qualidade dos produtos e atendimento impecável. Sempre recebo minhas cestas básicas com os melhores itens.",
                  rating: 5
                },
                {
                  name: "João Santos",
                  role: "Cliente desde 2021",
                  content: "Preços justos e entrega sempre pontual. Recomendo a todos que buscam qualidade e bom atendimento.",
                  rating: 5
                },
                {
                  name: "Ana Oliveira",
                  role: "Cliente desde 2022",
                  content: "Produtos frescos e de ótima qualidade. A EJG superou todas as minhas expectativas!",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                >
                  <div className="flex items-center mb-6">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-lg mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="font-bold text-lg text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 bg-gradient-to-r from-green-600 via-green-700 to-green-800 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/background.jpeg')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-700/95 to-green-800/95" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
                Pronto para fazer seu pedido?
              </h2>
              <p className="text-xl md:text-2xl text-green-50 mb-12 max-w-2xl mx-auto leading-relaxed">
                Junte-se a milhares de clientes satisfeitos e comece a receber produtos de qualidade em sua casa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products">
                  <Button 
                    size="lg" 
                    className="bg-white text-green-800 hover:bg-gray-50 text-lg px-10 py-7 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 font-semibold"
                  >
                    Fazer Pedido Agora
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
} 