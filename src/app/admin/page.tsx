"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, Edit2, Trash2, X, CheckCircle } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  promocao: boolean;
  imagem: string;
}

interface SuccessMessage {
  show: boolean;
  message: string;
}

export default function AdminPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<SuccessMessage>({
    show: false,
    message: "",
  });
  const [novoProduto, setNovoProduto] = useState<Omit<Produto, "id">>({
    nome: "",
    descricao: "",
    preco: 0,
    promocao: false,
    imagem: "",
  });
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [precoInput, setPrecoInput] = useState("");

  const carregarProdutos = () => {
    fetch("/api/produtos")
      .then((res) => res.json())
      .then(setProdutos)
      .catch(console.error);
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const resetForm = () => {
    setNovoProduto({
      nome: "",
      descricao: "",
      preco: 0,
      promocao: false,
      imagem: "",
    });
    setPrecoInput("");
    setImagemFile(null);
    setEditingId(null);
  };

  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrecoInput(value);
    
    const numeroLimpo = value.replace(",", ".");
    if (!isNaN(parseFloat(numeroLimpo))) {
      setNovoProduto(prev => ({
        ...prev,
        preco: parseFloat(numeroLimpo)
      }));
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage({ show: true, message });
    setTimeout(() => setSuccessMessage({ show: false, message: "" }), 3000);
  };

  const adicionarOuEditarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append("nome", novoProduto.nome);
      formData.append("descricao", novoProduto.descricao);
      formData.append("preco", novoProduto.preco.toString());
      formData.append("promocao", novoProduto.promocao.toString());

      if (imagemFile) {
        formData.append("imagem", imagemFile);
      }

      const response = await fetch(
        editingId ? `/api/produtos/${editingId}` : "/api/produtos",
        {
          method: editingId ? "PUT" : "POST",
          body: formData,
        }
      );

      if (response.ok) {
        showSuccessMessage(
          editingId ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!"
        );
        resetForm();
        carregarProdutos();
      } else {
        throw new Error("Erro na operação");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Ocorreu um erro ao salvar o produto");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImagemFile(file);
      setNovoProduto((prev) => ({ ...prev, imagem: file.name }));
    }
  };

  const handleEditarClick = (produto: Produto) => {
    setEditingId(produto.id);
    setNovoProduto({
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      promocao: produto.promocao,
      imagem: produto.imagem,
    });
    setPrecoInput(produto.preco.toString().replace(".", ","));
  };

  const excluirProduto = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }

    try {
      const response = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProdutos(prevProdutos => prevProdutos.filter(produto => produto.id !== id));
        showSuccessMessage("Produto excluído com sucesso!");
      } else {
        throw new Error("Erro ao excluir produto");
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert("Erro ao excluir o produto");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Mensagem de Sucesso */}
      {successMessage.show && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <CheckCircle size={20} />
          <span>{successMessage.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-black">
            {editingId ? "Editar Produto" : "Adicionar Novo Produto"}
          </h1>
          
          <form onSubmit={adicionarOuEditarProduto} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Nome do Produto
              </label>
              <input
                type="text"
                required
                value={novoProduto.nome}
                onChange={(e) =>
                  setNovoProduto({ ...novoProduto, nome: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Descrição
              </label>
              <textarea
                required
                value={novoProduto.descricao}
                onChange={(e) =>
                  setNovoProduto({ ...novoProduto, descricao: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Preço (R$)
              </label>
              <input
                type="text"
                required
                value={precoInput}
                onChange={handlePrecoChange}
                placeholder="0,00"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="promocao"
                checked={novoProduto.promocao}
                onChange={(e) =>
                  setNovoProduto({ ...novoProduto, promocao: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="promocao" className="text-sm text-black">
                Em Promoção
              </label>
            </div>

            {/* Área de upload */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-black">
                Arraste uma imagem ou clique para selecionar
              </p>
              {imagemFile && (
                <div className="mt-2 relative inline-block">
                  <Image
                    src={URL.createObjectURL(imagemFile)}
                    alt="Preview"
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImagemFile(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {editingId ? "Salvar Alterações" : "Adicionar Produto"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Produtos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-black">Produtos Cadastrados</h2>
          <div className="space-y-4">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
              >
                <Image
                  src={
                    produto.imagem.startsWith("http")
                      ? produto.imagem
                      : `/${produto.imagem}`
                  }
                  alt={produto.nome}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                />
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-black">{produto.nome}</h3>
                  <p className="text-sm text-black">{produto.descricao}</p>
                  <p className="text-blue-600 font-medium">
                    R$ {produto.preco.toFixed(2)}
                  </p>
                  {produto.promocao && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      Promoção
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                      onClick={() => handleEditarClick(produto)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    onClick={() => excluirProduto(produto.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}