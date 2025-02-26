import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Interface para o tipo de atualização de produto
interface ProdutoUpdateData {
  nome: string;
  descricao: string;
  preco: number;
  promocao: boolean;
  imagem?: string;
}

// Método PUT - Atualizar um produto existente
export async function PUT(req: NextRequest) {
  try {
    // Acessa o id diretamente da URL
    const { pathname } = req.nextUrl;
    const id = pathname.split("/")[3]; // Se a URL for '/api/produtos/[id]', o id estará na 3ª posição

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

    // Prepara os dados para atualização com o tipo correto
    const updateData: ProdutoUpdateData = {
      nome,
      descricao,
      preco,
      promocao
    };

    // Se uma nova imagem foi enviada, faz upload para o Vercel Blob
    if (imagemFile && imagemFile.size > 0) {
      // Cria um nome para o arquivo com timestamp para evitar colisões
      const fileName = `${Date.now()}-${id}-${imagemFile.name}`;
      
      // Faz upload para o Vercel Blob
      const blob = await put(fileName, imagemFile, {
        access: 'public',
        addRandomSuffix: true
      });
      
      // Adiciona a URL da imagem aos dados de atualização
      updateData.imagem = blob.url;
    }

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
export async function DELETE(req: NextRequest) {
  try {
    // Acessa o id diretamente da URL
    const { pathname } = req.nextUrl;
    const id = pathname.split("/")[3]; // Se a URL for '/api/produtos/[id]', o id estará na 3ª posição

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

    // Deleta o produto
    await prisma.produto.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "Produto deletado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return NextResponse.json(
      { error: "Erro ao deletar produto" },
      { status: 500 }
    );
  }
}