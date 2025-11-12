import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermissions } from "@/lib/permissions";

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

    // Verificar permissões: ADMIN e MANAGEMENT podem ver zonas de entrega
    const permissions = getPermissions(user.role);
    if (!permissions.canViewDeliveryZones) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const zones = await prisma.deliveryZone.findMany({
      orderBy: { city: "asc" },
    });

    return NextResponse.json({ zones }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar zonas de entrega:", error);
    return NextResponse.json(
      { message: "Erro ao buscar zonas de entrega" },
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

    // Verificar permissões: ADMIN e MANAGEMENT podem gerenciar zonas de entrega
    const permissions = getPermissions(user.role);
    if (!permissions.canManageDeliveryZones) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const { name, city, state = "SP", deliveryFee, active = true } = await request.json();

    if (!name || !city || typeof deliveryFee !== "number") {
      return NextResponse.json(
        { message: "Dados inválidos para a zona de entrega" },
        { status: 400 }
      );
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        name,
        city,
        state,
        deliveryFee,
        active,
      },
    });

    return NextResponse.json({ zone }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar zona de entrega:", error);
    return NextResponse.json(
      { message: "Erro ao criar zona de entrega" },
      { status: 500 }
    );
  }
}

