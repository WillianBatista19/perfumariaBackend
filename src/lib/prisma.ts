// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Criação da instância do Prisma Client
const prisma = new PrismaClient();

// Exportando a instância para ser utilizada nas rotas
export default prisma;
