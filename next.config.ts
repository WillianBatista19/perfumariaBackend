/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Adicione outros padrões se necessário
    ],
  },
}

module.exports = nextConfig