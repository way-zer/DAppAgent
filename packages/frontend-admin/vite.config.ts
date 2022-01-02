import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import path from 'path';


// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [reactRefresh()],
  resolve: {
    alias: {
      '@api': path.join(__dirname, 'src/api'),
    },
  },
});
