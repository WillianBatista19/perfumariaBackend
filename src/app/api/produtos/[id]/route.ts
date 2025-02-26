import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import sharp from "sharp";

// Configurações de otimização de imagem
const IMAGE_CONFIG = {
  maxWidth: 1200,      // Largura máxima
  quality: 80,         // Qualidade da compressão (0-100)
  format: 'webp'       // Formato de saída
} as const;

// Interface para os dados de atualização do produto
interface ProdutoUpdateData {
  nome: string;
  descricao: string;
  preco: number;
  promocao: boolean;
  imagem?: string;  // Propriedade opcional para a URL da imagem
}

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

// Função para otimizar imagens antes do upload para o Vercel Blob
async function otimizarImagem(imagemFile: File) {
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
    
    return imagemOtimizada;
  } catch (error) {
    console.error("Erro ao otimizar imagem:", error);
    throw new Error("Falha ao processar imagem");
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
    
    // Se uma imagem foi enviada, otimize-a e faça upload para o Vercel Blob
    if (imagemFile && imagemFile.size > 0) {
      try {
        // Otimiza a imagem antes do upload
        const imagemOtimizada = await otimizarImagem(imagemFile);
        
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
    }
    
    return NextResponse.json(novoProduto);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
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

    // Prepara os dados para atualização com a interface correta
    const updateData: ProdutoUpdateData = {
      nome,
      descricao,
      preco,
      promocao
    };

    // Se uma nova imagem foi enviada, otimize-a e faça upload para o Vercel Blob
    if (imagemFile && imagemFile.size > 0) {
      try {
        // Otimiza a imagem antes do upload
        const imagemOtimizada = await otimizarImagem(imagemFile);
        
        // Usa o ID do produto no nome do arquivo para evitar colisões
        const fileName = `produto-${id}-${Date.now()}.webp`;
        
        // Faz upload da imagem otimizada para o Vercel Blob
        const blob = await put(fileName, imagemOtimizada, {
          access: 'public',
          addRandomSuffix: false // não adiciona sufixo aleatório pois já temos ID e timestamp
        });
        
        // Adiciona a URL da imagem aos dados de atualização
        updateData.imagem = blob.url;
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        return NextResponse.json({ error: "Erro ao processar imagem" }, { status: 500 });
      }
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