import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermissions } from "@/lib/permissions";

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

    // Verificar permissões: ADMIN e FINANCIAL podem ver o fluxo de caixa
    const permissions = getPermissions(user.role);
    if (!permissions.canViewCashFlow) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const type = searchParams.get("type") || "";
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) {
        where.paymentDate.gte = new Date(dateFrom + "T00:00:00.000Z");
      }
      if (dateTo) {
        where.paymentDate.lte = new Date(dateTo + "T23:59:59.999Z");
      }
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        {
          description: {
            contains: search,
          },
        },
        {
          order: {
            customerName: {
              contains: search,
            },
          },
        },
        {
          order: {
            phone: {
              contains: search,
            },
          },
        },
      ];
    }

    const entries = await (prisma as any).cashFlow.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            phone: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    // Calcular totais
    const totalIncome = entries
      .filter((e: any) => e.type === "INCOME")
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const totalExpense = entries
      .filter((e: any) => e.type === "EXPENSE")
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const balance = totalIncome - totalExpense;

    return NextResponse.json(
      {
        entries,
        summary: {
          totalIncome,
          totalExpense,
          balance,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar fluxo de caixa:", error);
    return NextResponse.json(
      { message: "Erro ao buscar fluxo de caixa" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    // Verificar permissões: apenas ADMIN e FINANCIAL podem criar entradas no fluxo de caixa
    const permissions = getPermissions(user.role);
    if (!permissions.canCreateCashFlow) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const { type, amount, description, paymentDate, paymentMethod } = await request.json();

    if (!type || !amount || !description || !paymentDate) {
      return NextResponse.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { message: "Tipo inválido" },
        { status: 400 }
      );
    }

    if (paymentMethod && !["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BOLETO"].includes(paymentMethod)) {
      return NextResponse.json(
        { message: "Método de pagamento inválido" },
        { status: 400 }
      );
    }

    const entry = await (prisma as any).cashFlow.create({
      data: {
        type,
        amount: Number(amount),
        description,
        paymentMethod: paymentMethod || null,
        paymentDate: new Date(paymentDate),
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar entrada no fluxo de caixa:", error);
    return NextResponse.json(
      { message: "Erro ao criar entrada no fluxo de caixa" },
      { status: 500 }
    );
  }
}

