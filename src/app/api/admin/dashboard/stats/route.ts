import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermissions } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const stats: any = {};

    // Estatísticas de pedidos
    if (permissions.canViewOrders) {
      const totalOrders = await prisma.order.count();
      const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });
      const confirmedOrders = await prisma.order.count({ where: { status: "CONFIRMED" } });
      const inRouteOrders = await prisma.order.count({ where: { status: "IN_ROUTE" } });
      const deliveredOrders = await prisma.order.count({ where: { status: "DELIVERED" } });
      
      const todayOrders = await prisma.order.count({
        where: { createdAt: { gte: today } },
      });

      const thisMonthOrders = await prisma.order.count({
        where: { createdAt: { gte: thisMonth } },
      });

      // Receita do mês: apenas pedidos que foram pagos (paidAt não nulo)
      // IMPORTANTE: Receita é calculada baseada em pagamento, não em status de entrega
      const thisMonthRevenue = await prisma.order.aggregate({
        where: {
          AND: [
            { paidAt: { not: null } }, // Apenas pedidos pagos
            { paidAt: { gte: thisMonth } }, // Pagamentos deste mês
          ],
        },
        _sum: { total: true },
      });

      stats.orders = {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        inRoute: inRouteOrders,
        delivered: deliveredOrders,
        today: todayOrders,
        thisMonth: thisMonthOrders,
        thisMonthRevenue: thisMonthRevenue._sum.total || 0,
      };
    }

    // Estatísticas de produtos
    if (permissions.canViewProducts) {
      const totalProducts = await prisma.product.count();
      const lowStockProducts = await prisma.product.count({
        where: { stock: { lte: 10 } },
      });

      stats.products = {
        total: totalProducts,
        lowStock: lowStockProducts,
      };
    }

    // Estatísticas de usuários
    if (permissions.canViewUsers) {
      const totalUsers = await prisma.user.count({ where: { role: "USER" } });
      const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
      const totalDelivery = await prisma.user.count({ where: { role: "DELIVERY" } });
      // @ts-ignore - Novos roles ainda não reconhecidos pelo TypeScript, mas funcionam em runtime
      const totalFinancial = await prisma.user.count({ where: { role: "FINANCIAL" } });
      // @ts-ignore
      const totalManagement = await prisma.user.count({ where: { role: "MANAGEMENT" } });

      stats.users = {
        total: totalUsers,
        admins: totalAdmins,
        delivery: totalDelivery,
        financial: totalFinancial,
        management: totalManagement,
      };
    }

    // Estatísticas de entregas
    if (permissions.canViewDeliveryPersons) {
      const activeDeliveries = await prisma.order.count({
        where: {
          status: { in: ["CONFIRMED", "IN_ROUTE"] },
          deliveryPersonId: { not: null },
        },
      });

      stats.deliveries = {
        active: activeDeliveries,
      };
    }

    // Estatísticas financeiras
    if (permissions.canViewCashFlow) {
      const todayCashFlow = await prisma.cashFlow.aggregate({
        where: {
          paymentDate: { gte: today },
        },
        _sum: {
          amount: true,
        },
      });

      const thisMonthIncome = await prisma.cashFlow.aggregate({
        where: {
          type: "INCOME",
          paymentDate: { gte: thisMonth },
        },
        _sum: { amount: true },
      });

      const thisMonthExpense = await prisma.cashFlow.aggregate({
        where: {
          type: "EXPENSE",
          paymentDate: { gte: thisMonth },
        },
        _sum: { amount: true },
      });

      stats.cashFlow = {
        today: todayCashFlow._sum.amount || 0,
        thisMonthIncome: thisMonthIncome._sum.amount || 0,
        thisMonthExpense: thisMonthExpense._sum.amount || 0,
        balance: (thisMonthIncome._sum.amount || 0) - (thisMonthExpense._sum.amount || 0),
      };
    }

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { message: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}

