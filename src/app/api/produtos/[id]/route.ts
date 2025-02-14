import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";


// Método PUT - Atualizar um produto existente
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // Recupera o id da URL
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

    // Cria o formData a partir da requisição
    const formData = await req.formData();

    // Recupera os valores do formData
    const nome = formData.get("nome") as string | null;
    const descricao = formData.get("descricao") as string | null;
    const preco = parseFloat(formData.get("preco") as string || "0");
    const promocao = formData.get("promocao") === "true";

    // Verifica se todos os valores necessários foram encontrados
    if (!nome || !descricao || isNaN(preco)) {
      return NextResponse.json(
        { error: "Campos incompletos ou inválidos" },
        { status: 400 }
      );
    }

    // Atualiza o produto no banco de dados usando o Prisma
    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: {
        nome,
        descricao,
        preco,
        promocao
      }
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
      const id = params.id;
  
      // Verifica se o produto existe antes de excluir
      const produtoExistente = await prisma.produto.findUnique({ where: { id } });
  
      if (!produtoExistente) {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404 }
        );
      }
  
      // Verifique se o campo de imagem existe e não está vazio
      if (!produtoExistente.imagem) {
        return NextResponse.json(
          { error: "Produto não tem imagem associada" },
          { status: 400 }
        );
      }
  
      // Caminho da imagem que será removida
      // Verifica se a imagem não é uma URL externa e assume que está no diretório "public/images"
      const imagemPath = produtoExistente.imagem.startsWith("http")
        ? produtoExistente.imagem
        : path.join(process.cwd(), "public", produtoExistente.imagem);
  
      console.log("Caminho da imagem a ser excluída:", imagemPath); // Debug para verificar o caminho
  
      // Verifica se a imagem realmente existe
      if (fs.existsSync(imagemPath)) {
        console.log("Imagem encontrada, removendo..."); // Debug para confirmação
        fs.unlinkSync(imagemPath);
      } else {
        console.log("Imagem não encontrada no caminho especificado"); // Debug se não encontrar a imagem
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