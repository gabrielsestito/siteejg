import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermissions } from "@/lib/permissions";

async function ensurePermission() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: NextResponse.json({ message: "Usuário não autenticado" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return { error: NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 }) };
  }

  // Verificar permissões: ADMIN e MANAGEMENT podem gerenciar zonas de entrega
  const permissions = getPermissions(user.role);
  if (!permissions.canManageDeliveryZones) {
    return { error: NextResponse.json({ message: "Acesso não autorizado" }, { status: 403 }) };
  }

  return { session };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const guard = await ensurePermission();
    if (guard.error) return guard.error;

    const data = await request.json();

    const { name, city, state, deliveryFee, active } = data;

    if (
      deliveryFee !== undefined &&
      (typeof deliveryFee !== "number" || Number.isNaN(deliveryFee))
    ) {
      return NextResponse.json(
        { message: "Valor de taxa de entrega inválido" },
        { status: 400 }
      );
    }

    const zone = await prisma.deliveryZone.update({
      where: { id: params.id },
      data: {
        name,
        city,
        state,
        deliveryFee,
        active,
      },
    });

    return NextResponse.json({ zone }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar zona de entrega:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar zona de entrega" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const guard = await ensurePermission();
    if (guard.error) return guard.error;

    await prisma.deliveryZone.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao remover zona de entrega:", error);
    return NextResponse.json(
      { message: "Erro ao remover zona de entrega" },
      { status: 500 }
    );
  }
}

