import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

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
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
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
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as "USER" | "ADMIN" | "DELIVERY" | "FINANCIAL" | "MANAGEMENT";
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};