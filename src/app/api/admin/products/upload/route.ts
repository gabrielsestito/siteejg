import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado", message: "Você não tem permissão para realizar esta ação" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado", message: "Por favor, selecione uma imagem" },
        { status: 400 }
      );
    }

    // Validar se é uma imagem
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Arquivo inválido", message: "Por favor, envie apenas imagens" },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande", message: "O tamanho máximo permitido é 5MB" },
        { status: 400 }
      );
    }

    // Criar diretório de produtos se não existir
    const uploadDir = join(process.cwd(), "public", "products");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error("Erro ao criar diretório de produtos:", error);
      return NextResponse.json(
        { error: "Erro ao criar diretório", message: "Não foi possível criar o diretório de uploads" },
        { status: 500 }
      );
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Converter File para Buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retornar a URL da imagem (caminho relativo a partir de public)
    const imageUrl = `/products/${fileName}`;

    return NextResponse.json({ url: imageUrl, fileName }, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao fazer upload da imagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", message: error.message || "Ocorreu um erro ao fazer upload da imagem" },
      { status: 500 }
    );
  }
}

