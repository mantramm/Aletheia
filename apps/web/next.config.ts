import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@aletheia/contracts"],
  serverExternalPackages: ["@notionhq/client"],
};

export default nextConfig;
