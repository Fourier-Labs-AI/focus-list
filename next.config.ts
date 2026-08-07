import type { NextConfig } from "next";

// Keep the build-time value inert. scripts/prepare-harbour.mjs replaces this
// marker in both the standalone server and public asset trees with the
// tenant-relative HARBOUR_BASE_PATH after Next has emitted every manifest.
const harbourBasePathMarker = "/__HARBOUR_BASE_PATH__";

const nextConfig: NextConfig = {
  basePath: harbourBasePathMarker,
  output: "standalone",
};

export default nextConfig;
