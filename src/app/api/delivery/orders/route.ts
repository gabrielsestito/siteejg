import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - Listar corridas do entregador
export async function GET(request: Request) {
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
        { message: "Acesso não autorizado. Apenas entregadores podem acessar." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const date = searchParams.get("date") || "";

    const where: any = {
      deliveryPersonId: user.id,
    };

    if (status) {
      where.status = status;
    }

    // Filtro por data (para entregas entregues)
    if (date && status === "DELIVERED") {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Buscar por updatedAt quando status é DELIVERED
      where.updatedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orders = await prisma.order.findMany({
      where,
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calcular totais e garantir que items estejam presentes
    const ordersWithTotal = orders.map((order) => {
      const subtotal = order.subtotal ?? order.items.reduce((sum, item) => {
        return sum + item.quantity * item.price;
      }, 0);
      const deliveryFee = order.deliveryFee ?? 0;
      const total = order.total ?? subtotal + deliveryFee;

      return {
        ...order,
        subtotal,
        deliveryFee,
        total,
        items: order.items || [], // Garantir que items sempre seja um array
      };
    });

    return NextResponse.json({ orders: ordersWithTotal }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar corridas:", error);
    return NextResponse.json(
      { message: "Erro ao buscar corridas" },
      { status: 500 }
    );
  }
}

