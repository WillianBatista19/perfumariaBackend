import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Configurações de otimização de imagem
const IMAGE_CONFIG = {
  maxWidth: 1200,
  quality: 80,
  format: "webp",
} as const;

// Função para otimizar e salvar a imagem
const otimizarESalvarImagem = async (imagem: File, id: string) => {
  const pastaDestino = path.join(process.cwd(), "public", "images");

  if (!fs.existsSync(pastaDestino)) {
    fs.mkdirSync(pastaDestino, { recursive: true });
  }

  const nomeArquivo = `${id}-${imagem.name.replace(/\.[^/.]+$/, '')}.${IMAGE_CONFIG.format}`;
  const caminhoImagem = path.join(pastaDestino, nomeArquivo);

  try {
    const buffer = Buffer.from(await imagem.arrayBuffer());

    await sharp(buffer)
      .resize({
        width: IMAGE_CONFIG.maxWidth,
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_CONFIG.quality })
      .toFile(caminhoImagem);

    return `images/${nomeArquivo}`; // Corrigido para ser um caminho relativo
  } catch (error) {
    console.error("Erro ao otimizar imagem:", error);
    throw new Error("Falha ao processar imagem");
  }
};

// Método PUT - Atualizar um produto existente
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Verifica se o produto existe
    const produtoExistente = await prisma.produto.findUnique({
      where: { id }
    });

    if (!produtoExistente) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const nome = formData.get("nome") as string;
    const descricao = formData.get("descricao") as string;
    const preco = parseFloat(formData.get("preco") as string);
    const promocao = formData.get("promocao") === "true";
    const imagemFile = formData.get("imagem") as File | null;

    if (!nome || !descricao || isNaN(preco)) {
      return NextResponse.json(
        { error: "Campos incompletos ou inválidos" },
        { status: 400 }
      );
    }

    // Remove a imagem antiga se uma nova imagem foi enviada
    if (imagemFile && produtoExistente.imagem && !produtoExistente.imagem.startsWith('http')) {
      const imagemAntigaPath = path.join(process.cwd(), "public", produtoExistente.imagem);
      if (fs.existsSync(imagemAntigaPath)) {
        fs.unlinkSync(imagemAntigaPath);
      }
    }

    const updateData = {
      nome,
      descricao,
      preco,
      promocao,
      ...(imagemFile ? { imagem: await otimizarESalvarImagem(imagemFile, id) } : {})
    };

    // Atualiza o produto no banco de dados
    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: "Produto atualizado com sucesso",
      produto: produtoAtualizado
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    );
  }
}

// Método DELETE - Excluir um produto pelo ID
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await Promise.resolve(params);

    // Verifica se o produto existe antes de excluir
    const produtoExistente = await prisma.produto.findUnique({ where: { id } });

    if (!produtoExistente) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Remove a imagem se ela existir e não for uma URL externa
    if (produtoExistente.imagem && !produtoExistente.imagem.startsWith('http')) {
      const imagemPath = path.join(process.cwd(), "public", produtoExistente.imagem);
      if (fs.existsSync(imagemPath)) {
        fs.unlinkSync(imagemPath);
      }
    }

    // Exclui o produto do banco de dados
    await prisma.produto.delete({ where: { id } });

    return NextResponse.json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json(
      { error: "Erro ao excluir produto" },
      { status: 500 }
    );
  }
}