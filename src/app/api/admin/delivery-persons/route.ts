import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermissions } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

// GET - Listar todos os entregadores
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

    // Verificar permissões: ADMIN e MANAGEMENT podem ver entregadores
    const permissions = getPermissions(user.role);
    if (!permissions.canViewDeliveryPersons) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const deliveryPersons = await prisma.user.findMany({
      where: {
        role: "DELIVERY",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Adicionar estatísticas de cada entregador
    const deliveryPersonsWithStats = await Promise.all(
      deliveryPersons.map(async (person) => {
        const totalOrders = await prisma.order.count({
          where: { deliveryPersonId: person.id },
        });

        const inRouteOrders = await prisma.order.count({
          where: {
            deliveryPersonId: person.id,
            status: "IN_ROUTE",
          },
        });

        const deliveredToday = await prisma.order.count({
          where: {
            deliveryPersonId: person.id,
            status: "DELIVERED",
            updatedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        return {
          ...person,
          stats: {
            totalOrders,
            inRouteOrders,
            deliveredToday,
          },
        };
      })
    );

    return NextResponse.json(
      { deliveryPersons: deliveryPersonsWithStats },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar entregadores:", error);
    return NextResponse.json(
      { message: "Erro ao buscar entregadores" },
      { status: 500 }
    );
  }
}

