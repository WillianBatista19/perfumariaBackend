/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        domains: ["perfumaria-backend.vercel.app"],
      },
      // Adicione outros padrões se necessário
    ],
  },
}

module.exports = nextConfig