/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "api.telegram.org",
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      "supabase.co"
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["jspdf", "jspdf-autotable", "xlsx"]
  }
};

export default nextConfig;
