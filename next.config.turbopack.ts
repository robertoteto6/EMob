// Configuración específica para Turbopack
import type { NextConfig } from "next";

const turbopackConfig: NextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Configuraciones específicas para Turbopack
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
};

export default turbopackConfig;