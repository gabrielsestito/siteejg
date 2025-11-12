import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário atual é admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Acesso negado. Apenas administradores podem realizar esta ação." },
        { status: 403 }
      );
    }

    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar o papel do usuário para ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role: "ADMIN" },
    });

    return NextResponse.json(
      { message: "Usuário atualizado com sucesso", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário é admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Verificar se o usuário a ser removido existe
    const userToRemove = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!userToRemove) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Não permitir remover a si mesmo
    if (userToRemove.id === session.user.id) {
      return NextResponse.json(
        { message: "Não é possível remover a si mesmo" },
        { status: 400 }
      );
    }

    // Atualizar o usuário para USER
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Erro ao remover administrador:", error);
    return NextResponse.json(
      { message: "Erro ao remover administrador" },
      { status: 500 }
    );
  }
} 