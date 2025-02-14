import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          // ✅ Verificando se credentials não é undefined
          if (!credentials || !credentials.username || !credentials.password) {
            console.log("Credenciais inválidas");
            return null;
          }

          console.log("Credenciais recebidas:", credentials);

          // ✅ Validação de usuário e senha
          if (credentials.username === "admin" && credentials.password === "123456") {
            return { id: "1", name: "Admin" };
          }
          
          // Se não for o admin, retorna null
          return null;
        } catch (error: unknown) {
          if (error instanceof Error) {
            // Logando o erro caso ocorra
            console.error("Erro ao autenticar:", error.stack);
          } else {
            console.error("Erro desconhecido:", error);
          }
          return null; // Retorna null caso ocorra algum erro
        }
      },
    }),
  ],
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
