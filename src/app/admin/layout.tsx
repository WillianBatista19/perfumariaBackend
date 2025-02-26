"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth === "true") {
      setIsAuth(true);
    } else {
      setIsAuth(false);
      router.push("/admin/login");
    }
  }, [router]);

  if (isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Verificando autenticação...</p>
      </div>
    );
  }

  return <>{children}</>;
}
