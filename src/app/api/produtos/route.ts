import { put } from '@vercel/blob';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import sharp from "sharp";

// Configurações de otimização de imagem
const IMAGE_CONFIG = {
  maxWidth: 1200,      // Largura máxima
  quality: 80,         // Qualidade da compressão (0-100)
  format: 'webp'       // Formato de saída
} as const;

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
    
    // Se uma imagem foi enviada, otimize-a e faça upload para o Vercel Blob
    if (imagemFile && imagemFile.size > 0) {
      try {
        // Converte o File para buffer
        const buffer = Buffer.from(await imagemFile.arrayBuffer());
        
        // Otimiza a imagem com sharp
        const otimizadaBuffer = await sharp(buffer)
          .resize({
            width: IMAGE_CONFIG.maxWidth,
            withoutEnlargement: true,
          })
          .webp({ quality: IMAGE_CONFIG.quality })
          .toBuffer();
        
        // Cria um novo File com o buffer otimizado
        const nomeArquivoOriginal = imagemFile.name.replace(/\.[^/.]+$/, '');
        const nomeArquivoWebp = `${nomeArquivoOriginal}.webp`;
        const imagemOtimizada = new File([otimizadaBuffer], nomeArquivoWebp, { type: 'image/webp' });
        
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
        
        // Usa o ID do produto no nome do arquivo para evitar colisões
        const fileName = `produto-${novoProduto.id}-${Date.now()}.webp`;
        
        // Faz upload da imagem otimizada para o Vercel Blob
        const blob = await put(fileName, imagemOtimizada, {
          access: 'public',
          addRandomSuffix: false // não adiciona sufixo aleatório pois já temos ID e timestamp
        });
        
        // Obtém a URL da imagem
        imagemUrl = blob.url;
        
        // Atualiza o produto com a URL da imagem otimizada
        const produtoAtualizado = await prisma.produto.update({
          where: { id: novoProduto.id },
          data: { imagem: imagemUrl },
        });
        
        return NextResponse.json(produtoAtualizado);
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        return NextResponse.json({ error: "Erro ao processar imagem" }, { status: 500 });
      }
    } else {
      // Cria o produto sem imagem
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
    }
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}