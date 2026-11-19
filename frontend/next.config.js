/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Izinkan gambar dari URL manapun (Railway, Cloudinary, dll)
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '**.railway.app' },
      { protocol: 'https', hostname: '**.up.railway.app' },
      { protocol: 'https', hostname: '**.vercel.app' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // URL backend — otomatis dari env variable
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
