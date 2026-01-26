import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  serverExternalPackages: [
    "onnxruntime-node",
    "sharp",
    "bcrypt",
  ],

  allowedDevOrigins: [
    "terminology-bluetooth-legs-optimum.trycloudflare.com"
  ],
};

export default nextConfig;
