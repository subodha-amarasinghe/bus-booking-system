//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@bus-booking/passenger-core',
    '@bus-booking/shared-events',
    '@bus-booking/shared-types',
  ],
};

module.exports = nextConfig;
