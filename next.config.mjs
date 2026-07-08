/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "*": ["specs/**/*", "content/**/*"]
  },
  // Prevents "multiple copies of React" error when next-mdx-remote/rsc
  // compiles MDX at prerender time. Keeps its react/jsx-runtime import
  // resolving to the same copy Next.js uses.
  serverExternalPackages: ["next-mdx-remote"],
};

export default nextConfig;
