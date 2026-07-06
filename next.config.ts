import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

/** Keep module resolution inside hazaribagh-wa (not parent Hazaribagh workspace). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
