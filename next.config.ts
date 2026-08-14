import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/workspace", destination: "/creator", permanent: false },
      {
        source: "/director",
        destination: "/creator/ai-director",
        permanent: false,
      },
      {
        source: "/create",
        destination: "/creator/projects/new",
        permanent: false,
      },
      {
        source: "/story-world",
        destination: "/creator/projects",
        permanent: false,
      },
      {
        source: "/character-studio",
        destination: "/creator/projects",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
