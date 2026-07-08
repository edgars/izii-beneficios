/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "*": ["specs/**/*", "content/**/*"]
  }
};

export default nextConfig;
