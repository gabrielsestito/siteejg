import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { getPermissions } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

// PATCH - Atualizar usuário
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const permissions = getPermissions(user.role as any);
    if (!permissions.canEditUsers) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, name, email, password, role } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) {
      // Verificar se email já existe (exceto para o próprio usuário)
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { message: "Email já cadastrado" },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    if (password) {
      updateData.password = await hash(password, 10);
    }
    if (role) {
      const validRoles = ["USER", "ADMIN", "DELIVERY", "FINANCIAL", "MANAGEMENT"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { message: "Role inválido" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

