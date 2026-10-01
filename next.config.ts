import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(isProduction && {
    basePath: "/expense-tracker",
    assetPrefix: "/expense-tracker/",
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
