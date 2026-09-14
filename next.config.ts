import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The libSQL client has native bindings for file: URLs, so it must not be
  // bundled — it is required at runtime instead.
  serverExternalPackages: ["@libsql/client", "libsql"],

  experimental: {
    serverActions: {
      // Photos are shrunk in the browser before upload, so this is only
      // headroom for several at once. The default 1MB was too small for a
      // single phone photo and failed the upload with a 500.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
