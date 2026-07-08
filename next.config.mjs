/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "*": ["specs/**/*", "content/**/*"]
  },
  // Next.js 15: prevent bundling these packages so their react/jsx-runtime
  // import resolves to the same copy Next.js uses (avoids "older React" error).
  serverExternalPackages: ["next-mdx-remote", "@mdx-js/mdx"],
  // Next.js 14 equivalent of the above (safe to keep both).
  experimental: {
    serverComponentsExternalPackages: ["next-mdx-remote", "@mdx-js/mdx"],
  },
};

export default nextConfig;
