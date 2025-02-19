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

// Método GET - Buscar todos os produtos


export async function GET() {
  try {
    console.log("Iniciando busca de produtos");
    const produtos = await prisma.produto.findMany();
    console.log("Produtos encontrados:", produtos);
    return NextResponse.json(produtos);
  } catch (error: unknown) {
    // Tratando o erro com type guard
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erro desconhecido ao buscar produtos';
    
    console.error("Erro detalhado ao buscar produtos:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}

// Método POST com tratamento de erro corrigido
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nome = formData.get("nome") as string;
    const descricao = formData.get("descricao") as string;
    const preco = parseFloat(formData.get("preco") as string);
    const promocao = formData.get("promocao") === "true";
    const imagemFile = formData.get("imagem") as File;

    if (!nome || !descricao || isNaN(preco) || !imagemFile) {
      return NextResponse.json(
        { error: "Dados incompletos ou imagem não fornecida" }, 
        { status: 400 }
      );
    }

    const novoProduto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        preco,
        promocao,
        imagem: "",
      }
    });

    const imagemUrl = await otimizarESalvarImagem(imagemFile, novoProduto.id);

    const produtoAtualizado = await prisma.produto.update({
      where: { id: novoProduto.id },
      data: { imagem: imagemUrl },
    });

    return NextResponse.json(produtoAtualizado);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erro desconhecido ao criar produto';
    
    console.error("Erro ao criar produto:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}

// Função otimizarESalvarImagem com tratamento de erro atualizado
const otimizarESalvarImagem = async (imagem: File, id: string): Promise<string> => {
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

    return `images/${nomeArquivo}`;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erro desconhecido ao processar imagem';
    
    console.error("Erro ao otimizar imagem:", errorMessage);
    throw new Error(errorMessage);
  }
};