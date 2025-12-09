// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   typescript: {
//     ignoreBuildErrors: true,
//   },
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false, // Vẫn giữ dòng này
        os: false,
        path: false,
        worker_threads: false,
        canvas: false,
      };
      
      // THÊM ĐOẠN NÀY NẾU CẦN THIẾT
      config.resolve.alias = {
        ...config.resolve.alias,
        encoding: false, 
      };
    }
    return config;
  },
};

export default nextConfig;