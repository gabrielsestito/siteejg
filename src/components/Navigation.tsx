"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { Notifications } from "./Notifications";
import { canAccessAdmin } from "@/lib/permissions";

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const NavLinks = () => (
    <>
      {session && (
        <Link
          href="/cart"
          className="relative text-gray-600 hover:text-green-600"
          onClick={() => setIsMenuOpen(false)}
        >
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      )}

      <Link
        href="/products"
        className={`${
          pathname === "/products" ? "text-green-600" : "text-gray-600"
        } hover:text-green-600`}
        onClick={() => setIsMenuOpen(false)}
      >
        Produtos
      </Link>

      {session ? (
        <>
          <Link
            href="/orders"
            className={`${
              pathname === "/orders" ? "text-green-600" : "text-gray-600"
            } hover:text-green-600`}
            onClick={() => setIsMenuOpen(false)}
          >
            Meus Pedidos
          </Link>
          {canAccessAdmin(session.user.role) && (
            <>
              {session.user.role === "ADMIN" && <Notifications />}
              <Link
                href="/admin"
                className={`${
                  pathname === "/admin" || pathname.startsWith("/admin/") ? "text-green-600" : "text-gray-600"
                } hover:text-green-600`}
                onClick={() => setIsMenuOpen(false)}
              >
                {session.user.role === "ADMIN" ? "Admin" : session.user.role === "FINANCIAL" ? "Financeiro" : "Gerência"}
              </Link>
            </>
          )}
          {session.user.role === "DELIVERY" && (
            <Link
              href="/delivery"
              className={`${
                pathname === "/delivery" ? "text-green-600" : "text-gray-600"
              } hover:text-green-600`}
              onClick={() => setIsMenuOpen(false)}
            >
              Entregas
            </Link>
          )}
          <button
            onClick={() => {
              signOut();
              setIsMenuOpen(false);
            }}
            className="text-gray-600 hover:text-green-600"
          >
            Sair
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className={`${
              pathname === "/login" ? "text-green-600" : "text-gray-600"
            } hover:text-green-600`}
            onClick={() => setIsMenuOpen(false)}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={`${
              pathname === "/register" ? "text-green-600" : "text-gray-600"
            } hover:text-green-600`}
            onClick={() => setIsMenuOpen(false)}
          >
            Cadastrar
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-md relative">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="relative h-16 w-40 -ml-2">
            <Image
              src="/logo.png"
              alt="EJG Cestas Básicas"
              fill
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLinks />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600 hover:text-green-600"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-md z-50">
          <div className="flex flex-col space-y-4 px-4 py-4">
            <NavLinks />
          </div>
        </div>
      )}
    </nav>
  );
} 