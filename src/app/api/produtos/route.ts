import sharp from "sharp";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Configurações de otimização de imagem
const IMAGE_CONFIG = {
  maxWidth: 1200,      // Largura máxima
  quality: 80,         // Qualidade da compressão (0-100)
  format: 'webp'       // Formato de saída
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
      return NextResponse.json({ error: "Dados incompletos ou imagem não fornecida" }, { status: 400 });
    }

    // Cria o produto primeiro para obter o ID
    const novoProduto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        preco,
        promocao,
        imagem: "",  // Deixamos a imagem em branco por enquanto
      }
    });

    // Após a criação, otimiza e salva a imagem
    const imagemUrl = await otimizarESalvarImagem(imagemFile, novoProduto.id);

    // Atualiza o produto com a URL da imagem otimizada
    const produtoAtualizado = await prisma.produto.update({
      where: { id: novoProduto.id },
      data: { imagem: imagemUrl },
    });

    return NextResponse.json(produtoAtualizado);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
