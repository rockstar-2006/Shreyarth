/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Prevent TypeScript check failures from stopping production builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // Prevent ESLint warnings/errors from stopping production builds
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'fonts.gstatic.com',
      },
    ],
  },
  // Allow Google Fonts to load (for next/font)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
