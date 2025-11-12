import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    // Retornar array vazio em caso de erro para não quebrar o frontend
    return NextResponse.json({ products: [] }, { status: 200 });
  }
} 