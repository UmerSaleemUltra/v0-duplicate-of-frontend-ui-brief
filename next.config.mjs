/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },
  turbopack: {
    root: ".",
    resolveAlias: {
      fs: { type: "empty" },
      path: { type: "empty" },
      crypto: { type: "empty" },
      net: { type: "empty" },
      tls: { type: "empty" },
      dns: { type: "empty" },
      "child_process": { type: "empty" },
      "timers/promises": { type: "empty" },
      "util/types": { type: "empty" },
      "fs/promises": { type: "empty" },
    },
    rules: {
      "*.node": {
        loaders: ["ignore-loader"],
      },
    },
  },
  webpack: (config, { isServer }) => {
    // Apply fallbacks for all built-in Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      net: false,
      tls: false,
      dns: false,
      "child_process": false,
      "timers/promises": false,
      "util/types": false,
      "fs/promises": false,
    }

    if (!isServer) {
      // Mark server-only packages as external on client
      const serverOnlyPackages = [
        "mongodb",
        "mongodb-client-encryption",
        "kerberos",
        "snappy",
        "socks",
        "node-fetch",
        "fetch-blob",
      ]
      
      config.externals = [
        ...(config.externals || []),
        /^mongodb/,
        /^kerberos/,
        /^snappy/,
        /^socks/,
        /^node-fetch/,
        /^fetch-blob/,
      ]
    }
    
    return config
  },
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/:path(.*\\.(?:ico|png|svg|jpg|jpeg|webp|avif|woff2|woff))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ]
  },
}

export default nextConfig
