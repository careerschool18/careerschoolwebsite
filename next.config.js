const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://careerschool.co.in/api/v1/:path*',
      },
    ]
  },
}

module.exports = nextConfig;
