import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ajuste para o caminho correto do seu Prisma
import fs from "fs";
import path from "path";

// Função para salvar a imagem na pasta public/images
const salvarImagem = async (imagem: File) => {
  const pastaDestino = path.join(process.cwd(), "public", "images");

  if (!fs.existsSync(pastaDestino)) {
    fs.mkdirSync(pastaDestino, { recursive: true });
  }

  const nomeArquivo = `${Date.now()}-${imagem.name}`;
  const caminhoImagem = path.join(pastaDestino, nomeArquivo);

  const imagemBuffer = Buffer.from(await imagem.arrayBuffer());
  fs.writeFileSync(caminhoImagem, imagemBuffer);

  return `images/${nomeArquivo}`; // Caminho relativo para ser salvo no banco
};

// Método GET - Buscar todos os produtos
export async function GET() {
  try {
    const produtos = await prisma.produto.findMany();
    return NextResponse.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

// Método POST - Criar um novo produto
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nome = formData.get("nome") as string;
    const descricao = formData.get("descricao") as string;
    const preco = parseFloat(formData.get("preco") as string);
    const promocao = formData.get("promocao") === "true";
    const imagemFile = formData.get("imagem") as File;

    if (!nome || !descricao || isNaN(preco) || !imagemFile) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const imagemUrl = await salvarImagem(imagemFile);

    const novoProduto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        preco,
        promocao,
        imagem: imagemUrl,
      },
    });

    return NextResponse.json(novoProduto);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}

// Método PUT - Atualizar um produto existente
export async function PUT(req: Request) {
  try {
    const formData = await req.formData();

    const id = formData.get("id") as string;
    const nome = formData.get("nome") as string;
    const descricao = formData.get("descricao") as string;
    const preco = parseFloat(formData.get("preco") as string);
    const promocao = formData.get("promocao") === "true";
    const imagemFile = formData.get("imagem") as File | null; // Pode ser opcional

    if (!id || !nome || !descricao || isNaN(preco)) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    let imagemUrl;
    if (imagemFile) {
      imagemUrl = await salvarImagem(imagemFile);
    }

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: {
        nome,
        descricao,
        preco,
        promocao,
        ...(imagemUrl && { imagem: imagemUrl }), // Atualiza a imagem apenas se uma nova for enviada
      },
    });

    return NextResponse.json(produtoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

// Método DELETE - Excluir um produto pelo ID
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json(); // Pega o ID do produto

    if (!id) {
      return NextResponse.json({ error: "ID do produto não fornecido" }, { status: 400 });
    }

    // Verifica se o produto existe antes de excluir
    const produtoExistente = await prisma.produto.findUnique({ where: { id } });

    if (!produtoExistente) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    await prisma.produto.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json({ error: "Erro ao excluir produto" }, { status: 500 });
  }
}
