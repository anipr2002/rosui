import { createMDX } from 'fumadocs-mdx/next';
import typegpu from 'unplugin-typegpu/webpack';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false
    }
    config.externals.push('node-gyp-build')
    
    // Add TypeGPU plugin for WGSL transpilation
    if (!isServer) {
      config.plugins.push(typegpu())
    }
    
    return config
  }
};

const withMDX = createMDX({
  // customise the config file path
  // configPath: "source.config.ts"
});

export default withMDX(config);