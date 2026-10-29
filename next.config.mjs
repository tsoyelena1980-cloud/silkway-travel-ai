const isStaticExport = process.env.STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isStaticExport
    ? {
        output: 'export',
        basePath: '/silkway-travel-ai',
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
