// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";

// export const authOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         username: { label: "Usuário", type: "text" },
//         password: { label: "Senha", type: "password" },
//       },
//       async authorize(credentials) {
//         try {
//           if (!credentials || !credentials.username || !credentials.password) {
//             console.log("Credenciais inválidas");
//             return null;
//           }

//           console.log("Credenciais recebidas:", credentials);

//           if (credentials.username === "admin" && credentials.password === "123456") {
//             return { id: "1", name: "Admin" };
//           }

//           return null;
//         } catch (error) {
//           if (error instanceof Error) {
//             console.error("Erro ao autenticar:", error.stack);
//           } else {
//             console.error("Erro desconhecido:", error);
//           }
//           return null;
//         }
//       },
//     }),
//   ],
// };

// const handler = NextAuth(authOptions);

// // Next.js 13 com App Directory requer que você exporte os métodos GET e POST
// export { handler as GET, handler as POST };
