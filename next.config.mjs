/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15: prevent bundling these packages so their react/jsx-runtime
  // import resolves to the same copy Next.js uses (avoids "older React" error).
  serverExternalPackages: ["next-mdx-remote", "@mdx-js/mdx"],
};

export default nextConfig;
