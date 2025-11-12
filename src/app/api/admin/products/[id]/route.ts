import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado", message: "Você não tem permissão para realizar esta ação" },
        { status: 401 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado", message: "O produto solicitado não foi encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", message: "Ocorreu um erro ao buscar o produto" },
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

    // Se não houver imagem fornecida, mantém a atual
    // Se houver imagem fornecida, usa a nova
    let imageUrl = '';
    if (image && typeof image === 'string' && image.trim()) {
      imageUrl = image.trim();
    } else {
      // Se não houver imagem fornecida, mantém a atual
      const currentProduct = await prisma.product.findUnique({ 
        where: { id: params.id }, 
        select: { image: true } 
      });
      imageUrl = currentProduct?.image || '/image.jpg';
    }

    const product = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        image: imageUrl, // Caminho da imagem (nova ou atual)
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", message: error.message || "Ocorreu um erro ao atualizar o produto" },
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

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado", message: "Você não tem permissão para realizar esta ação" },
        { status: 401 }
      );
    }

    // Primeiro, remover todas as referências ao produto no carrinho
    await prisma.cartItem.deleteMany({
      where: {
        productId: params.id,
      },
    });

    // Depois, remover todas as referências ao produto nos pedidos
    await prisma.orderItem.deleteMany({
      where: {
        productId: params.id,
      },
    });

    // Por fim, excluir o produto
    const product = await prisma.product.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", message: error.message || "Ocorreu um erro ao excluir o produto" },
      { status: 500 }
    );
  }
} 