import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// PATCH - Atualizar status da corrida (iniciar rota, confirmar entrega)
export async function PATCH(
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

    if (!user || user.role !== "DELIVERY") {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body; // "start_route" ou "confirm_delivery"

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (order.deliveryPersonId !== user.id) {
      return NextResponse.json(
        { message: "Este pedido não está atribuído a você" },
        { status: 403 }
      );
    }

    let newStatus: "IN_ROUTE" | "DELIVERED";
    if (action === "start_route") {
      if (order.status !== "CONFIRMED") {
        return NextResponse.json(
          { message: "Apenas pedidos confirmados podem iniciar rota" },
          { status: 400 }
        );
      }
      newStatus = "IN_ROUTE";
    } else if (action === "confirm_delivery") {
      if (order.status !== "IN_ROUTE") {
        return NextResponse.json(
          { message: "Apenas pedidos em rota podem ser confirmados como entregues" },
          { status: 400 }
        );
      }
      newStatus = "DELIVERED";
    } else {
      return NextResponse.json(
        { message: "Ação inválida" },
        { status: 400 }
      );
    }

    console.log(`[DELIVERY API] Atualizando pedido ${params.id}: ${order.status} -> ${newStatus}`);

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status: newStatus },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        deliveryPerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Calcular totais
    const subtotal = updatedOrder.subtotal ?? updatedOrder.items.reduce((sum, item) => {
      return sum + item.quantity * item.price;
    }, 0);
    const deliveryFee = updatedOrder.deliveryFee ?? 0;
    const total = updatedOrder.total ?? subtotal + deliveryFee;

    const orderWithTotal = {
      ...updatedOrder,
      subtotal,
      deliveryFee,
      total,
      items: updatedOrder.items || [],
    };

    return NextResponse.json({ 
      order: orderWithTotal 
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar corrida:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar corrida" },
      { status: 500 }
    );
  }
}

