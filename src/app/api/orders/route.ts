import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const {
      items,
      customerName,
      phone,
      deliveryAddress,
      deliveryNumber,
      deliveryComplement,
      deliveryNeighborhood,
      deliveryZoneId,
      paymentMethod,
    } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Itens do pedido são obrigatórios" },
        { status: 400 }
      );
    }

    if (!customerName || !deliveryAddress || !deliveryNumber || !deliveryNeighborhood || !phone) {
      return NextResponse.json(
        { message: "Dados de entrega e contato são obrigatórios" },
        { status: 400 }
      );
    }

    if (!deliveryZoneId) {
      return NextResponse.json(
        { message: "Selecione uma cidade válida" },
        { status: 400 }
      );
    }

    const zone = await prisma.deliveryZone.findFirst({
      where: {
        id: deliveryZoneId,
        active: true,
      },
    });

    if (!zone) {
      return NextResponse.json(
        { message: "Cidade selecionada não disponível para entrega" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );

    const deliveryFee = zone.deliveryFee;
    const total = subtotal + deliveryFee;

    const allowedPaymentMethods = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BOLETO"];
    const normalizedPaymentMethod = allowedPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : "PIX";

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        subtotal,
        deliveryFee,
        total,
        customerName,
        phone,
        deliveryAddress,
        deliveryNumber,
        deliveryComplement,
        deliveryNeighborhood,
        deliveryCity: zone.city,
        deliveryState: zone.state,
        deliveryZoneId: zone.id,
        paymentMethod: normalizedPaymentMethod,
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Clear cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    // Send WhatsApp message to admin
    const adminPhone = process.env.ADMIN_PHONE;
    if (adminPhone) {
      const itemsText = order.items
        .map(
          (item) =>
            `${item.product.name} - ${item.quantity}x - R$ ${(item.price * item.quantity).toFixed(2)}`
        )
        .join("\n");

      const addressLine = `${order.deliveryAddress}, ${order.deliveryNumber}${
        order.deliveryComplement ? ` - ${order.deliveryComplement}` : ""
      }`;

      const deliveryInfo = `Nome: ${order.customerName}\nTelefone: ${order.phone}\nEndereço: ${addressLine}\nBairro: ${order.deliveryNeighborhood}\nCidade: ${order.deliveryCity}/${order.deliveryState ?? ""}`;

      const paymentLabels: Record<string, string> = {
        PIX: "PIX",
        CREDIT_CARD: "Cartão de Crédito",
        DEBIT_CARD: "Cartão de Débito",
        CASH: "Dinheiro",
        BOLETO: "Boleto",
      };

      const paymentInfo = `Forma de Pagamento: ${paymentLabels[order.paymentMethod] ?? order.paymentMethod}`;

      const message = `Novo pedido recebido!\n\n${deliveryInfo}\n\nItens:\n${itemsText}\n\nSubtotal: R$ ${subtotal.toFixed(
        2
      )}\nEntrega: R$ ${deliveryFee.toFixed(2)}\nTotal: R$ ${total.toFixed(2)}\n\n${paymentInfo}`;

      const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(
        message
      )}`;

      // In a real application, you would use a proper WhatsApp API
      console.log("WhatsApp message URL:", whatsappUrl);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json(
      { message: "Erro ao criar pedido" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        files: true,
        boletoInstallments: {
          orderBy: {
            installmentNumber: "asc",
          },
        } as any,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar pedidos" },
      { status: 500 }
    );
  }
} 