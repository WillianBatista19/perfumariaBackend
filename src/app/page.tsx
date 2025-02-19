"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  promocao: boolean;
  imagem: string;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/produtos")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        // Verifica se data é um array
        if (Array.isArray(data)) {
          setProdutos(data);
        } else {
          throw new Error('Dados recebidos não estão no formato esperado');
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar produtos:", error);
        setError("Não foi possível carregar os produtos. Tente novamente mais tarde.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Só filtra se produtos for um array
  const filteredProdutos = searchTerm
    ? produtos.filter((produto) =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : produtos;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-800 text-center">
            Nossos Produtos
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border text-black border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl shadow-lg p-4">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProdutos.map((produto) => (
              <div
                key={produto.id}
                className="group bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative h-48">
                  <Image
                    src={produto.imagem.startsWith("http") ? produto.imagem : `/${produto.imagem}`}
                    alt={produto.nome}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                  {produto.promocao && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Promoção
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{produto.nome}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{produto.descricao}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-800">
                      R$ {produto.preco.toFixed(2)}
                    </span>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-300">
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}