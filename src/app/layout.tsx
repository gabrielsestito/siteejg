import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "react-hot-toast";
import { sharedMetadata, sharedViewport } from "./metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata = sharedMetadata;
export const viewport = sharedViewport;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <AuthProvider>
          <CartProvider>
            <div className="flex-grow">
              {children}
            </div>
            <Toaster position="top-center" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 