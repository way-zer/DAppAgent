import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import dappAgent from 'sdk/vite-plugin';
import {join} from 'path';


// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [reactRefresh(), dappAgent()],
  resolve: {
    alias: {
      '@api': join(__dirname, 'src/api'),
    },
  },
});
