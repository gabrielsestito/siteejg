import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: NextResponse.json({ message: "Usuário não autenticado" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: NextResponse.json({ message: "Acesso não autorizado" }, { status: 403 }) };
  }

  return { session };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; installmentId: string } }
) {
  try {
    const guard = await ensureAdmin();
    if (guard.error) return guard.error;

    const { paid, paymentDate } = await request.json();

    const installment = await (prisma as any).boletoInstallment.findUnique({
      where: { id: params.installmentId },
      include: { order: true },
    });

    if (!installment) {
      return NextResponse.json(
        { message: "Parcela não encontrada" },
        { status: 404 }
      );
    }

    const now = new Date();
    const paymentDateValue = paymentDate ? new Date(paymentDate) : now;

    // Atualizar parcela
    await (prisma as any).boletoInstallment.update({
      where: { id: params.installmentId },
      data: {
        paidAt: paid ? paymentDateValue : null,
      },
    });

    // Se marcou como pago, criar entrada no fluxo de caixa
    if (paid) {
      await (prisma as any).cashFlow.create({
        data: {
          orderId: installment.orderId,
          type: "INCOME",
          amount: installment.amount,
          description: `Parcela ${installment.installmentNumber} do pedido #${installment.orderId.slice(0, 8)}`,
          paymentMethod: "BOLETO",
          paymentDate: paymentDateValue,
        },
      });

      // Verificar se todas as parcelas estão pagas para marcar o pedido como pago
      const allInstallments = await (prisma as any).boletoInstallment.findMany({
        where: { orderId: installment.orderId },
      });

      const allPaid = allInstallments.every((inst: any) => inst.paidAt !== null);

      if (allPaid) {
        await prisma.order.update({
          where: { id: installment.orderId },
          data: { paidAt: paymentDateValue },
        });
      }
    } else {
      // Se desmarcou como pago, remover do fluxo de caixa
      await (prisma as any).cashFlow.deleteMany({
        where: {
          orderId: installment.orderId,
          description: {
            contains: `Parcela ${installment.installmentNumber}`,
          },
        },
      });

      // Verificar se ainda há parcelas pagas
      const paidInstallments = await (prisma as any).boletoInstallment.findMany({
        where: {
          orderId: installment.orderId,
          paidAt: { not: null },
        },
      });

      if (paidInstallments.length === 0) {
        await prisma.order.update({
          where: { id: installment.orderId },
          data: { paidAt: null },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar parcela:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar parcela" },
      { status: 500 }
    );
  }
}

