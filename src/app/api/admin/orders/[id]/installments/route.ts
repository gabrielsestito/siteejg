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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const guard = await ensureAdmin();
    if (guard.error) return guard.error;

    const { installments } = await request.json();

    if (!Array.isArray(installments) || installments.length === 0) {
      return NextResponse.json(
        { message: "Parcelas são obrigatórias" },
        { status: 400 }
      );
    }

    // Verificar se o pedido existe
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Remover parcelas existentes
    await (prisma as any).boletoInstallment.deleteMany({
      where: { orderId: params.id },
    });

    // Criar novas parcelas
    const createdInstallments = await Promise.all(
      installments.map((inst: { amount: number; dueDate: string }, index: number) => {
        // Criar data no timezone local para evitar problemas de conversão UTC
        // O formato YYYY-MM-DD é interpretado como UTC, então precisamos criar manualmente
        const [year, month, day] = inst.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day); // month é 0-indexed no JavaScript
        
        return (prisma as any).boletoInstallment.create({
          data: {
            orderId: params.id,
            installmentNumber: index + 1,
            amount: inst.amount,
            dueDate: dueDate,
          },
        });
      })
    );

    return NextResponse.json({ installments: createdInstallments }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar parcelas:", error);
    return NextResponse.json(
      { message: "Erro ao criar parcelas" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const guard = await ensureAdmin();
    if (guard.error) return guard.error;

    const installments = await (prisma as any).boletoInstallment.findMany({
      where: { orderId: params.id },
      orderBy: { installmentNumber: "asc" },
    });

    return NextResponse.json({ installments }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar parcelas:", error);
    return NextResponse.json(
      { message: "Erro ao buscar parcelas" },
      { status: 500 }
    );
  }
}

