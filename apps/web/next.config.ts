import type { NextConfig } from "next";

const basePath =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  basePath,
  typedRoutes: false,
  useFileSystemPublicRoutes: false,
  transpilePackages: [
    "@workspace/api-client-react",
    "@workspace/api-zod",
    "@workspace/db",
  ],
};

export default nextConfig;
