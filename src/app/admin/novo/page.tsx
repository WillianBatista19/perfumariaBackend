// "use client";
// import { useState } from "react";

// export default function NovoProdutoPage() {
//   const [nome, setNome] = useState("");
//   const [descricao, setDescricao] = useState("");
//   const [preco, setPreco] = useState("");
//   const [promocao, setPromocao] = useState(false);

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     await fetch("/api/produtos", {
//       method: "POST",
//       body: JSON.stringify({ nome, descricao, preco: parseFloat(preco), promocao }),
//       headers: { "Content-Type": "application/json" },
//     });
//     window.location.href = "/admin";
//   }

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">Adicionar Produto</h1>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <input className="border p-2 w-full" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" required />
//         <textarea className="border p-2 w-full" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" required />
//         <input className="border p-2 w-full" type="number" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="Preço" required />
//         <label className="flex items-center">
//           <input type="checkbox" checked={promocao} onChange={(e) => setPromocao(e.target.checked)} className="mr-2" />
//           Em Promoção?
//         </label>
//         <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
//       </form>
//     </div>
//   );
// }
