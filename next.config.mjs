/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode in development.
  // Strict Mode double-invokes effects which causes the socket to
  // connect → disconnect → reconnect constantly, breaking real-time sync.
  reactStrictMode: false,
};

export default nextConfig;
