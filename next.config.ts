import type { NextConfig } from "next";

/** Static export is only needed for production builds. */
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  ...(isDev ? {} : { output: "export" as const }),
  trailingSlash: true,
};

export default nextConfig;
