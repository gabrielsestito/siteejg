import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermissions } from "@/lib/permissions";

// GET - Listar todos os entregadores
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar permissões: ADMIN e MANAGEMENT podem ver entregadores
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const permissions = getPermissions(user.role);
    if (!permissions.canViewDeliveryPersons) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Buscar todos os usuários com role DELIVERY
    const deliveryPersons = await prisma.user.findMany({
      where: {
        role: "DELIVERY",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            deliveryOrders: {
              where: {
                status: {
                  in: ["CONFIRMED", "IN_ROUTE"],
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ deliveryPersons }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar entregadores:", error);
    return NextResponse.json(
      { message: "Erro ao buscar entregadores" },
      { status: 500 }
    );
  }
}

// POST - Adicionar entregador (por email)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar permissões: ADMIN e MANAGEMENT podem gerenciar entregadores
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const permissions = getPermissions(user.role);
    if (!permissions.canManageDeliveryPersons) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se já é entregador
    if (existingUser.role === "DELIVERY") {
      return NextResponse.json(
        { message: "Este usuário já é um entregador" },
        { status: 400 }
      );
    }

    // Atualizar o usuário para entregador
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: "DELIVERY" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Erro ao adicionar entregador:", error);
    return NextResponse.json(
      { message: "Erro ao adicionar entregador" },
      { status: 500 }
    );
  }
}

// DELETE - Remover entregador (voltar para USER)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar permissões: ADMIN e MANAGEMENT podem gerenciar entregadores
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const permissions = getPermissions(user.role);
    if (!permissions.canManageDeliveryPersons) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o usuário a ser removido existe
    const userToRemove = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToRemove) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se é entregador
    if (userToRemove.role !== "DELIVERY") {
      return NextResponse.json(
        { message: "Este usuário não é um entregador" },
        { status: 400 }
      );
    }

    // Verificar se tem entregas em andamento
    const activeDeliveries = await prisma.order.count({
      where: {
        deliveryPersonId: userId,
        status: {
          in: ["CONFIRMED", "IN_ROUTE"],
        },
      },
    });

    if (activeDeliveries > 0) {
      return NextResponse.json(
        { message: `Não é possível remover. Este entregador tem ${activeDeliveries} entrega(s) em andamento.` },
        { status: 400 }
      );
    }

    // Atualizar o usuário para USER
    const updatedUser = await prisma.user.update({
      where: { id: userId },
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
    console.error("Erro ao remover entregador:", error);
    return NextResponse.json(
      { message: "Erro ao remover entregador" },
      { status: 500 }
    );
  }
}

