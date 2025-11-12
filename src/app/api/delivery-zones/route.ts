import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: { active: true },
      orderBy: { city: "asc" },
    });

    return NextResponse.json({ zones: zones || [] }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar zonas de entrega:", error);
    // Retornar array vazio em caso de erro para não quebrar o frontend
    return NextResponse.json({ zones: [] }, { status: 200 });
  }
}

