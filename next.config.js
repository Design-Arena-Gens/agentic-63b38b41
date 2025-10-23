/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['image.tmdb.org', 'is1-ssl.mzstatic.com', 'static.tvmaze.com'],
    unoptimized: true
  }
}

module.exports = nextConfig
