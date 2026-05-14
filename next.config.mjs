/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/onboarding",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
