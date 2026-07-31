import type { NextConfig } from "next";

function normalizeBasePath(value: string | undefined) {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

const nextConfig: NextConfig = {
  basePath: normalizeBasePath(process.env.HARBOUR_BASE_PATH),
};

export default nextConfig;
