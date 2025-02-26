/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ywjgcq906gmn1uam.public.blob.vercel-storage.com'
      },
    ],
  },
}

module.exports = nextConfig