/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  redirects: async () => [
    {
      source: "/:path*",
      destination: "/",
      permanent: false,
    },
  ],
}

export default nextConfig
