import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário existe no banco
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    let cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // If cart doesn't exist, create a new one
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Erro ao buscar carrinho:", error);
    return NextResponse.json(
      { message: "Erro ao buscar carrinho" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity } = body;
    console.log("Request body:", { productId, quantity });

    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { message: "Produto e quantidade válida são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    console.log("Product found:", product);

    if (!product) {
      return NextResponse.json(
        { message: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se há estoque suficiente
    if (product.stock < quantity) {
      return NextResponse.json(
        { message: "Quantidade solicitada maior que o estoque disponível" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe no banco
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar ou criar carrinho
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });
    console.log("Existing cart:", cart);

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
        include: { items: true },
      });
      console.log("New cart created:", cart);
    }

    // Verificar se o produto já está no carrinho
    const existingItem = cart.items.find(
      (item: { productId: string }) => item.productId === productId
    );

    if (existingItem) {
      // Atualizar quantidade se o produto já existe
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { message: "Quantidade total solicitada maior que o estoque disponível" },
          { status: 400 }
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Adicionar novo item ao carrinho
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Buscar o carrinho atualizado com os produtos
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    console.log("Updated cart:", updatedCart);

    return NextResponse.json(
      { message: "Produto adicionado ao carrinho com sucesso", items: updatedCart?.items || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro no carrinho:", error);
    return NextResponse.json(
      { message: "Erro ao adicionar produto ao carrinho" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { message: "ID do item é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o item pertence ao carrinho do usuário
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart) {
      return NextResponse.json(
        { message: "Carrinho não encontrado" },
        { status: 404 }
      );
    }

    const item = cart.items.find((item: { id: string }) => item.id === itemId);

    if (!item) {
      return NextResponse.json(
        { message: "Item não encontrado no carrinho" },
        { status: 404 }
      );
    }

    // Remover o item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json(
      { message: "Item removido do carrinho com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao remover item do carrinho:", error);
    return NextResponse.json(
      { message: "Erro ao remover item do carrinho" },
      { status: 500 }
    );
  }
} 