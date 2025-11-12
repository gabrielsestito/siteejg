import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
                description: true,
                price: true,
                image: true,
              },
            },
          },
        },
        files: true,
        boletoInstallments: {
          orderBy: {
            installmentNumber: "asc",
          },
        },
      } as any,
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json(
      { message: "Erro ao buscar pedido" },
      { status: 500 }
    );
  }
}

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

    // Verificar se o usuário tem permissão para editar pedidos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões: ADMIN, FINANCIAL e MANAGEMENT podem editar pedidos
    const { getPermissions } = await import("@/lib/permissions");
    const permissions = getPermissions(user.role);
    if (!permissions.canEditOrders) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: params.id } });

    if (!existingOrder) {
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const data: Record<string, unknown> = {};

    // IMPORTANTE: Status e pagamento são independentes
    // Um pedido pode estar DELIVERED sem estar pago (paidAt: null)
    // Um pedido só é considerado pago quando paidAt tem uma data
    // FINANCIAL pode editar apenas campos financeiros (paidAt, paymentMethod, notes)
    // ADMIN e MANAGEMENT podem editar todos os campos
    const isFinancialOnly = user.role === "FINANCIAL";
    
    if (body.status && !isFinancialOnly) {
      if (!["PENDING", "CONFIRMED", "IN_ROUTE", "DELIVERED"].includes(body.status)) {
        return NextResponse.json(
          { message: "Status inválido" },
          { status: 400 }
        );
      }
      data.status = body.status;
      // NOTA: Atualizar o status NÃO altera o paidAt
      // O paidAt só é alterado quando explicitamente fornecido no body.paidAt
    }

    if (body.paymentMethod) {
      if (!["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BOLETO"].includes(body.paymentMethod)) {
        return NextResponse.json(
          { message: "Forma de pagamento inválida" },
          { status: 400 }
        );
      }
      data.paymentMethod = body.paymentMethod;
    }

    // FINANCIAL não pode editar deliveryDate e deliveryFee (apenas campos financeiros)
    if (body.deliveryDate !== undefined && !isFinancialOnly) {
      if (body.deliveryDate) {
        // Criar data como meia-noite no timezone local para evitar problemas de conversão
        const dateParts = body.deliveryDate.split('-');
        const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        data.deliveryDate = localDate;
      } else {
        data.deliveryDate = null;
      }
    }

    if (body.deliveryFee !== undefined && !isFinancialOnly) {
      if (typeof body.deliveryFee !== "number" || Number.isNaN(body.deliveryFee)) {
        return NextResponse.json(
          { message: "Taxa de entrega inválida" },
          { status: 400 }
        );
      }
      const currentSubtotal = (existingOrder as any)?.subtotal ?? 0;
      data.deliveryFee = body.deliveryFee;
      data.total = currentSubtotal + body.deliveryFee;
    }

    if (body.paidAt !== undefined) {
      let paymentDate: Date | null = null;
      
      if (body.paidAt) {
        // Criar data como meia-noite no timezone local para evitar problemas de conversão
        const dateParts = body.paidAt.split('-');
        paymentDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        data.paidAt = paymentDate;
      } else {
        data.paidAt = null;
      }

      // Obter o método de pagamento atual (pode ter sido atualizado no mesmo request)
      const currentPaymentMethod = body.paymentMethod || (existingOrder as any).paymentMethod;

      // Se marcou como pago e não é boleto, criar entrada no fluxo de caixa
      if (paymentDate && currentPaymentMethod !== "BOLETO") {
        // Verificar se já existe entrada no fluxo de caixa
        const existingEntry = await (prisma as any).cashFlow.findFirst({
          where: { orderId: params.id },
        });

        if (!existingEntry) {
          await (prisma as any).cashFlow.create({
            data: {
              orderId: params.id,
              type: "INCOME",
              amount: (existingOrder as any).total ?? 0,
              description: `Pedido #${params.id.slice(0, 8)}`,
              paymentMethod: currentPaymentMethod,
              paymentDate: paymentDate,
            },
          });
        } else {
          // Atualizar entrada existente com método de pagamento
          await (prisma as any).cashFlow.update({
            where: { id: existingEntry.id },
            data: {
              paymentMethod: currentPaymentMethod,
              paymentDate: paymentDate,
            },
          });
        }
      } else if (!paymentDate && currentPaymentMethod !== "BOLETO") {
        // Se desmarcou como pago, remover do fluxo de caixa
        await (prisma as any).cashFlow.deleteMany({
          where: { orderId: params.id },
        });
      }
    }

    if (body.notes !== undefined) {
      data.notes = body.notes || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "Nenhum dado válido para atualizar" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data,
      include: {
        boletoInstallments: {
          orderBy: { installmentNumber: "asc" },
        },
      } as any,
    });

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar pedido" },
      { status: 500 }
    );
  }
} 