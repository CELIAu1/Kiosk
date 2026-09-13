import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The libSQL client has native bindings for file: URLs, so it must not be
  // bundled — it is required at runtime instead.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
