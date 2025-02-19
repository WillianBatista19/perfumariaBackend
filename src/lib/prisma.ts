import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const client = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = client
}

// Adicionar tratamento de conexão
client.$connect()
  .then(() => {
    console.log('Successfully connected to database')
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error)
  })

export default client