const isStaticExport = process.env.STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: isStaticExport ? '/silkway-travel-ai' : '',
  },
  ...(isStaticExport
    ? {
        output: 'export',
        basePath: '/silkway-travel-ai',
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
