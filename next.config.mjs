/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Katta fayllar brauzerdan to'g'ridan-to'g'ri Supabase Storage ga yuklanadi,
  // shuning uchun server action hajmini oshirish shart emas.
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
};

export default nextConfig;
