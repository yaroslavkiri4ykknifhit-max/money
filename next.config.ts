import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/money",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

