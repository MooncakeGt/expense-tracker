import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/expense-tracker",
  assetPrefix: "/expense-tracker/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;