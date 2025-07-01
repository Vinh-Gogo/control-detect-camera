import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/python-api/:path*',
        // The destination is the Python service running in another container.
        // We use an environment variable to switch between local dev and Docker.
        destination: `${process.env.PYTHON_API_URL || 'http://localhost:5000'}/:path*`,
      },
    ]
  },
};

export default nextConfig;
