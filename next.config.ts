import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "res.cloudinary.com" },
      { hostname: "maps.googleapis.com" },
      { hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
