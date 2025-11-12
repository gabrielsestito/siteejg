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

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Buscar parcelas próximas do vencimento (próximos 3 dias) e vencidas
    const upcomingInstallments = await (prisma as any).boletoInstallment.findMany({
      where: {
        paidAt: null,
        dueDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            phone: true,
            total: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const overdueInstallments = await (prisma as any).boletoInstallment.findMany({
      where: {
        paidAt: null,
        dueDate: {
          lt: now,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            phone: true,
            total: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json(
      {
        upcoming: upcomingInstallments,
        overdue: overdueInstallments,
        count: upcomingInstallments.length + overdueInstallments.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json(
      { message: "Erro ao buscar notificações" },
      { status: 500 }
    );
  }
}

