import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", message: "Ocorreu um erro ao buscar os produtos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado", message: "Você não tem permissão para realizar esta ação" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, stock, image, categoryId } = body;

    if (!name || !description || price === undefined || stock === undefined || !categoryId) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando", message: "Por favor, preencha todos os campos obrigatórios" },
        { status: 400 }
      );
    }

    // Validar se a imagem foi fornecida
    if (!image || typeof image !== 'string' || !image.trim()) {
      return NextResponse.json(
        { error: "Imagem obrigatória", message: "Por favor, faça upload de uma imagem" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        image: image.trim(), // Caminho da imagem após upload (ex: /products/uuid.jpg)
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", message: error.message || "Ocorreu um erro ao criar o produto" },
      { status: 500 }
    );
  }
} 