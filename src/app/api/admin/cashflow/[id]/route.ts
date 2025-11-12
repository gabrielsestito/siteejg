import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermissions } from "@/lib/permissions";

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

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões: apenas ADMIN e FINANCIAL podem editar entradas no fluxo de caixa
    const permissions = getPermissions(user.role);
    if (!permissions.canEditCashFlow) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const { type, amount, description, paymentDate, paymentMethod } = await request.json();

    // Verificar se a entrada existe
    const existingEntry = await (prisma as any).cashFlow.findUnique({
      where: { id: params.id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { message: "Entrada não encontrada" },
        { status: 404 }
      );
    }

    // Validar dados
    if (type && !["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { message: "Tipo inválido" },
        { status: 400 }
      );
    }

    if (paymentMethod !== undefined && paymentMethod !== null && !["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BOLETO"].includes(paymentMethod)) {
      return NextResponse.json(
        { message: "Método de pagamento inválido" },
        { status: 400 }
      );
    }

    const data: any = {};
    if (type !== undefined) data.type = type;
    if (amount !== undefined) data.amount = Number(amount);
    if (description !== undefined) data.description = description;
    if (paymentDate !== undefined) data.paymentDate = new Date(paymentDate);
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod || null;

    const entry = await (prisma as any).cashFlow.update({
      where: { id: params.id },
      data,
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
    });

    return NextResponse.json({ entry }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar entrada no fluxo de caixa:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar entrada no fluxo de caixa" },
      { status: 500 }
    );
  }
}

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

    // Verificar permissões: apenas ADMIN e FINANCIAL podem deletar entradas no fluxo de caixa
    const permissions = getPermissions(user.role);
    if (!permissions.canDeleteCashFlow) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Verificar se a entrada existe
    const existingEntry = await (prisma as any).cashFlow.findUnique({
      where: { id: params.id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { message: "Entrada não encontrada" },
        { status: 404 }
      );
    }

    await (prisma as any).cashFlow.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Entrada excluída com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao excluir entrada do fluxo de caixa:", error);
    return NextResponse.json(
      { message: "Erro ao excluir entrada do fluxo de caixa" },
      { status: 500 }
    );
  }
}

