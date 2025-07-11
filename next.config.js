/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    // 在客户端构建中排除服务端模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
      };
      
      // 排除 firebase-admin 相关模块
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'firebase-admin',
        'firebase-admin/app': 'firebase-admin/app',
        'firebase-admin/firestore': 'firebase-admin/firestore',
        'firebase-admin/storage': 'firebase-admin/storage',
      });
    }
    
    return config;
  }
}

module.exports = nextConfig