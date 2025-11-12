import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - Buscar pedidos de um entregador específico
export async function GET(
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

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Verificar se o entregador existe
    const deliveryPerson = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!deliveryPerson || deliveryPerson.role !== "DELIVERY") {
      return NextResponse.json(
        { message: "Entregador não encontrado" },
        { status: 404 }
      );
    }

    // Buscar pedidos do entregador
    const orders = await prisma.order.findMany({
      where: {
        deliveryPersonId: params.id,
      },
      include: {
        user: {
          select: {
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
                price: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: "asc" }, // CONFIRMED primeiro, depois IN_ROUTE, depois DELIVERED
        { createdAt: "desc" },
      ],
    });

    // Separar por status para formar o itinerário
    const confirmedOrders = orders.filter((o) => o.status === "CONFIRMED");
    const inRouteOrders = orders.filter((o) => o.status === "IN_ROUTE");
    const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");

    return NextResponse.json({
      orders,
      itinerary: {
        confirmed: confirmedOrders,
        inRoute: inRouteOrders,
        delivered: deliveredOrders,
      },
      deliveryPerson: {
        id: deliveryPerson.id,
        name: deliveryPerson.name,
        email: deliveryPerson.email,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar pedidos do entregador:", error);
    return NextResponse.json(
      { message: "Erro ao buscar pedidos do entregador" },
      { status: 500 }
    );
  }
}

