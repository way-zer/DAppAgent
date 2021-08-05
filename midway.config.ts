import { defineConfig } from '@midwayjs/hooks';

export default defineConfig({
  source: './src',
  routes: [
    {
      baseDir: 'apis/lambda',
      basePath: '/api',
    },
    {
      baseDir: 'apis/page',
      basePath: '/',
    },
  ],
});
