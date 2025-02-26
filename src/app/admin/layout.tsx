"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth !== "true") {
      router.push("/admin/login"); // Redireciona se não estiver autenticado
    } else {
      setIsAuth(true);
    }
  }, []);

  if (!isAuth) return null; // Evita piscar a tela antes do redirecionamento

  return <>{children}</>;
}
