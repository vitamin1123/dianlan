import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import removeConsole from 'vite-plugin-remove-console';
import { resolve } from 'path';

const pathResolve = (dir) => {
  return resolve(__dirname, '.', dir);
};

export default defineConfig({
  plugins: [vue(), removeConsole()], // 添加插件
  worker: {
    format: 'es', // 必须使用ES模块
    plugins: []
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: pathResolve('src'),
      },
    ],
  },
  build: {
    minify: 'esbuild', // 使用 esbuild
  },
});