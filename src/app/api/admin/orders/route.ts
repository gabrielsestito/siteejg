import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

interface OrderWithRelations {
  id: string;
  userId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  deliveryNumber: string;
  deliveryComplement: string | null;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryState: string | null;
  paymentMethod: string;
  deliveryDate: Date | null;
  paidAt: Date | null;
  user: {
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      price: number;
    };
  }>;
}

interface OrderWithTotal extends OrderWithRelations {
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem permissão para ver pedidos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões: ADMIN, FINANCIAL e MANAGEMENT podem ver pedidos
    const { getPermissions } = await import("@/lib/permissions");
    const permissions = getPermissions(user.role);
    if (!permissions.canViewOrders) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Obter parâmetros de busca da URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentMethod = searchParams.get("paymentMethod") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const where: any = {};

    // Filtro de busca geral (código ou nome)
    if (search) {
      where.OR = [
        {
          id: {
            contains: search,
          },
        },
        {
          customerName: {
            contains: search,
          },
        },
        {
          user: {
            name: {
              contains: search,
            },
          },
        },
        {
          phone: {
            contains: search,
          },
        },
      ];
    }

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por forma de pagamento
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // Filtro por data
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom + "T00:00:00.000Z");
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
      }
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
                name: true,
                price: true,
              },
            },
          },
        },
        boletoInstallments: {
          orderBy: {
            installmentNumber: "asc",
          },
        } as any,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calcular o total para cada pedido
    const ordersWithTotal: OrderWithTotal[] = orders.map((order: OrderWithRelations) => {
      const subtotal = order.subtotal ?? order.items.reduce((sum: number, item) => {
        return sum + item.quantity * item.product.price;
      }, 0);

      const deliveryFee = order.deliveryFee ?? 0;
      const total = order.total ?? subtotal + deliveryFee;

      return {
        ...order,
        subtotal,
        deliveryFee,
        total,
      };
    });

    return NextResponse.json({ orders: ordersWithTotal }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json(
      { message: "Erro ao buscar pedidos" },
      { status: 500 }
    );
  }
} 