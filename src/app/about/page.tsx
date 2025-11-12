'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Users, Target, Award, Heart, ChevronRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-r from-green-600 to-green-800">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-[url('/background.jpeg')] bg-cover bg-center opacity-20"
          />
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl md:text-6xl font-bold mb-8 text-white"
            >
              Nossa História
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-xl text-white max-w-3xl mx-auto"
            >
              Conheça a EJG Cestas Básicas, sua parceira em qualidade e confiança desde 2020
            </motion.p>
          </div>
        </section>

        {/* About Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-6">Quem Somos</h2>
                <p className="text-gray-600 text-lg mb-6">
                  A EJG Cestas Básicas nasceu com o propósito de fornecer produtos de qualidade a preços acessíveis para todas as famílias. Desde nossa fundação, temos nos dedicado a selecionar os melhores produtos e oferecer um serviço excepcional.
                </p>
                <p className="text-gray-600 text-lg mb-6">
                  Nossa trajetória é marcada pelo compromisso com a qualidade, transparência e satisfação dos nossos clientes. Acreditamos que cada família merece ter acesso a produtos de primeira linha a preços justos.
                </p>
                <div className="flex gap-4">
                  <Link href="/products">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      Ver Produtos
                    </Button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl"
              >
                <Image
                  src="/image.jpg"
                  alt="EJG Cestas Básicas"
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg"
              >
                <div className="mb-6">
                  <Target className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Nossa Missão</h3>
                <p className="text-gray-600 text-lg">
                  Fornecer produtos de qualidade a preços acessíveis, garantindo a satisfação dos nossos clientes e contribuindo para o bem-estar das famílias brasileiras.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg"
              >
                <div className="mb-6">
                  <Award className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Nossa Visão</h3>
                <p className="text-gray-600 text-lg">
                  Ser referência nacional em cestas básicas, reconhecida pela qualidade dos produtos, excelência no atendimento e compromisso com nossos clientes.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-center mb-16"
            >
              Nossos Valores
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Qualidade',
                  description: 'Compromisso com a excelência em todos os nossos produtos e serviços',
                  icon: <Award className="w-12 h-12 text-green-600" />
                },
                {
                  title: 'Transparência',
                  description: 'Honestidade e clareza em todas as nossas relações',
                  icon: <Heart className="w-12 h-12 text-green-600" />
                },
                {
                  title: 'Compromisso',
                  description: 'Dedicação total ao bem-estar dos nossos clientes',
                  icon: <Users className="w-12 h-12 text-green-600" />
                }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="mb-6">{value.icon}</div>
                  <h3 className="text-2xl font-semibold mb-4">{value.title}</h3>
                  <p className="text-gray-600 text-lg">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-green-600 to-green-800">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-4xl font-bold mb-8 text-white">Faça parte da nossa história</h2>
              <p className="text-xl text-white mb-12">
                Conheça nossos produtos e descubra por que somos a escolha certa para sua família
              </p>
              <Link href="/products">
                <Button 
                  size="lg" 
                  className="bg-white text-green-800 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                >
                  Ver Produtos
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
} 