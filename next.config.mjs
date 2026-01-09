/** @type {import('next').NextConfig} */
import { codeInspectorPlugin } from "code-inspector-plugin"

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = "cheap-module-source-map"
      config.plugins.push(codeInspectorPlugin({ bundler: "webpack" }))
    }
    return config
  },
}

export default nextConfig
