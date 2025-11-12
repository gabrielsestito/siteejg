import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

declare module "next-auth" {
  interface User {
    role?: "USER" | "ADMIN" | "DELIVERY" | "FINANCIAL" | "MANAGEMENT";
  }
  
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN" | "DELIVERY" | "FINANCIAL" | "MANAGEMENT";
      name?: string | null;
      email?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN" | "DELIVERY" | "FINANCIAL" | "MANAGEMENT";
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Email ou senha inválidos");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Email ou senha inválidos");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role as "USER" | "ADMIN" | "DELIVERY" | "FINANCIAL" | "MANAGEMENT",
        },
      };
    },
  },
}; 