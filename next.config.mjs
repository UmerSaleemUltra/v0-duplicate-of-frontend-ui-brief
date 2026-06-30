import webpack from 'webpack'

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
      // Create externals array
      const existingExternals = Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []
      
      // Server-only packages and patterns
      const serverOnlyPatterns = [
        /^mongodb/,
        /^kerberos/,
        /^snappy/,
        /^socks/,
        /^node-fetch/,
        /^fetch-blob/,
        /^@mongodb/,
        /^mongodb-client-encryption/,
      ]
      
      config.externals = [
        ...existingExternals,
        ...serverOnlyPatterns,
        (context, request, callback) => {
          if (serverOnlyPatterns.some(pattern => pattern.test(request))) {
            return callback(null, `commonjs ${request}`)
          }
          callback()
        },
      ]

      // Add IgnorePlugin to prevent server modules from being bundled
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(mongodb|kerberos|snappy|socks|node-fetch|fetch-blob|@mongodb|mongodb-client-encryption)/,
          contextRegExp: /./,
        })
      )
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
