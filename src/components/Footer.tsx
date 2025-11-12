'use client';

import Link from 'next/link';
import { COMPANY_INFO } from '@/lib/company';
import { MapPin, Phone, Building2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4 text-green-400">EJG Produtos Alimentícios</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Qualidade e variedade para sua família desde sempre.
            </p>
            <div className="flex items-center gap-2 text-gray-400">
              <Building2 className="w-5 h-5 text-green-400" />
              <span className="text-sm">{COMPANY_INFO.name}</span>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-green-400">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <a
                    href={`tel:${COMPANY_INFO.phone.replace(/\D/g, '')}`}
                    className="text-gray-300 hover:text-green-400 transition-colors"
                  >
                    {COMPANY_INFO.phone}
                  </a>
                  <a
                    href={`tel:${COMPANY_INFO.phoneFixed.replace(/\D/g, '')}`}
                    className="text-gray-400 hover:text-green-400 transition-colors text-sm"
                  >
                    {COMPANY_INFO.phoneFixed}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 leading-relaxed">
                  {COMPANY_INFO.fullAddress}
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-green-400">Links Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-green-400 transition-colors inline-block"
                >
                  Produtos
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-green-400 transition-colors inline-block"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-gray-300 hover:text-green-400 transition-colors inline-block"
                >
                  Meus Pedidos
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-green-400">Informações Legais</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex flex-col">
                <span className="font-semibold text-green-400 mb-1">CNPJ:</span>
                <span className="text-sm">{COMPANY_INFO.cnpj}</span>
              </li>
              <li className="flex flex-col">
                <span className="font-semibold text-green-400 mb-1">IE:</span>
                <span className="text-sm">{COMPANY_INFO.ie}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} {COMPANY_INFO.name}. Todos os direitos reservados.
            </p>
            <p className="text-gray-500 text-sm">
              Desenvolvido com ❤️ para você - Gabriel Sestito
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

