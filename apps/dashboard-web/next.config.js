//@ts-check
const path = require('path');


/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  transpilePackages: [
    '@bus-booking/shared-types',
    '@bus-booking/shared-events',
    '@bus-booking/shared-utils',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@bus-booking/shared-types': path.resolve(
        __dirname,
        '../../libs/shared-types/src/index.ts',
      ),
      '@bus-booking/shared-events': path.resolve(
        __dirname,
        '../../libs/shared-events/src/index.ts',
      ),
      '@bus-booking/shared-utils': path.resolve(
        __dirname,
        '../../libs/shared-utils/src/index.ts',
      ),
    };
    return config;
  },
};

module.exports = nextConfig;
