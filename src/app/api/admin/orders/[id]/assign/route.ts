import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermissions } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

// POST - Atribuir entregador a um pedido
export async function POST(
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões: ADMIN e MANAGEMENT podem atribuir entregadores
    const permissions = getPermissions(user.role);
    if (!permissions.canAssignDelivery) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { deliveryPersonId } = body;

    if (!deliveryPersonId) {
      return NextResponse.json(
        { message: "ID do entregador é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o entregador existe e tem role DELIVERY
    const deliveryPerson = await prisma.user.findUnique({
      where: { id: deliveryPersonId },
    });

    if (!deliveryPerson || deliveryPerson.role !== "DELIVERY") {
      return NextResponse.json(
        { message: "Entregador não encontrado ou inválido" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (order.status !== "CONFIRMED") {
      return NextResponse.json(
        { message: "Apenas pedidos confirmados podem ser atribuídos a um entregador" },
        { status: 400 }
      );
    }

    // Atualizar pedido com entregador e status CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        deliveryPersonId,
        status: "CONFIRMED",
      },
      include: {
        deliveryPerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atribuir entregador:", error);
    return NextResponse.json(
      { message: "Erro ao atribuir entregador" },
      { status: 500 }
    );
  }
}

// DELETE - Remover atribuição do entregador
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões: ADMIN e MANAGEMENT podem atribuir entregadores
    const permissions = getPermissions(user.role);
    if (!permissions.canAssignDelivery) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (order.status === "IN_ROUTE" || order.status === "DELIVERED") {
      return NextResponse.json(
        { message: "Não é possível remover entregador de pedidos em rota ou entregues" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        deliveryPersonId: null,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error) {
    console.error("Erro ao remover atribuição:", error);
    return NextResponse.json(
      { message: "Erro ao remover atribuição" },
      { status: 500 }
    );
  }
}

