import { put } from '@vercel/blob';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    const imagemFile = formData.get("imagem") as File | null;
    
    if (!nome || !descricao || isNaN(preco)) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }
    
    // Variável para armazenar a URL da imagem
    let imagemUrl = "";
    
    // Se uma imagem foi enviada, faça upload para o Vercel Blob
    if (imagemFile && imagemFile.size > 0) {
      // Cria um nome para o arquivo com timestamp para evitar colisões
      const fileName = `${Date.now()}-${imagemFile.name}`;
      
      // Faz upload para o Vercel Blob
      const blob = await put(fileName, imagemFile, {
        access: 'public',
        addRandomSuffix: true // adiciona um sufixo aleatório para evitar conflitos
      });
      
      // Obtém a URL da imagem
      imagemUrl = blob.url;
    }
    
    // Cria o produto com a URL da imagem do Vercel Blob
    const novoProduto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        preco,
        promocao,
        imagem: imagemUrl
      }
    });
    
    return NextResponse.json(novoProduto);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}