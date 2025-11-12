import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário é admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Buscar arquivo no banco
    const file = await prisma.file.findUnique({
      where: { id: params.fileId },
    });

    if (!file) {
      return NextResponse.json(
        { message: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Remover arquivo físico
    const filePath = join(process.cwd(), "public", file.url);
    await unlink(filePath).catch(() => {});

    // Remover registro do banco
    await prisma.file.delete({
      where: { id: params.fileId },
    });

    return NextResponse.json({ message: "Arquivo removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover arquivo:", error);
    return NextResponse.json(
      { message: "Erro ao remover arquivo" },
      { status: 500 }
    );
  }
} 