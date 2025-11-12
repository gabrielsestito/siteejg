import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões: ADMIN, FINANCIAL e MANAGEMENT podem ver pedidos não pagos
    const { getPermissions } = await import("@/lib/permissions");
    const permissions = getPermissions(user.role);
    if (!permissions.canViewUnpaidOrders) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Buscar pedidos não pagos (sem paidAt - independente do status)
    // IMPORTANTE: Um pedido só é considerado pago quando paidAt tiver uma data
    // Não importa se está PENDING, CONFIRMED, IN_ROUTE ou DELIVERED
    const unpaidOrders = await prisma.order.findMany({
      where: {
        paidAt: null,
        // Removido filtro de status - agora mostra todos os pedidos não pagos
        // independente se estão pendentes, confirmados, em rota ou entregues
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
                name: true,
                price: true,
              },
            },
          },
        },
        boletoInstallments: {
          where: {
            paidAt: null,
          },
          orderBy: {
            dueDate: "asc",
          },
        } as any,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Enriquecer com informações de vencimento
    const ordersWithDueInfo = unpaidOrders.map((order) => {
      let urgencyLevel: "normal" | "upcoming" | "overdue" = "normal";
      let daysUntilDue: number | null = null;
      let nextDueDate: Date | null = null;

      if (order.paymentMethod === "BOLETO" && order.boletoInstallments && order.boletoInstallments.length > 0) {
        // Pegar a primeira parcela não paga
        const firstUnpaidInstallment = order.boletoInstallments[0];
        if (firstUnpaidInstallment) {
          nextDueDate = new Date(firstUnpaidInstallment.dueDate);
          const diffTime = nextDueDate.getTime() - now.getTime();
          daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysUntilDue < 0) {
            urgencyLevel = "overdue";
          } else if (daysUntilDue <= 3) {
            urgencyLevel = "upcoming";
          }
        }
      } else {
        // Para outros métodos de pagamento, considerar a data de criação
        const daysSinceOrder = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceOrder > 7) {
          urgencyLevel = "overdue";
        } else if (daysSinceOrder > 3) {
          urgencyLevel = "upcoming";
        }
        daysUntilDue = -daysSinceOrder;
      }

      const subtotal = order.subtotal ?? order.items.reduce((sum, item) => {
        return sum + item.quantity * item.product.price;
      }, 0);

      const deliveryFee = order.deliveryFee ?? 0;
      const total = order.total ?? subtotal + deliveryFee;

      return {
        ...order,
        subtotal,
        deliveryFee,
        total,
        urgencyLevel,
        daysUntilDue,
        nextDueDate,
      };
    });

    // Separar por urgência
    const overdue = ordersWithDueInfo.filter((o) => o.urgencyLevel === "overdue");
    const upcoming = ordersWithDueInfo.filter((o) => o.urgencyLevel === "upcoming");
    const normal = ordersWithDueInfo.filter((o) => o.urgencyLevel === "normal");

    return NextResponse.json(
      {
        orders: ordersWithDueInfo,
        overdue,
        upcoming,
        normal,
        total: ordersWithDueInfo.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar pedidos não pagos:", error);
    return NextResponse.json(
      { message: "Erro ao buscar pedidos não pagos" },
      { status: 500 }
    );
  }
}

