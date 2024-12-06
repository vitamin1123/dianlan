import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import {resolve} from "path"
const pathResolve = (dir) => {
  return resolve(__dirname,'.',dir)
}
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server:{
    host:'0.0.0.0',
    port:8080,
  } ,
  resolve:{
    alias: [
      {
        find:"@",
        replacement: pathResolve('src')
      }]
  }
})
