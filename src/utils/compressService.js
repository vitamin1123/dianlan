// src/utils/compressService.js
export class CompressService {
    constructor() {
      this.worker = new Worker(
        new URL('../workers/compress.worker.js', import.meta.url),
        { type: 'module' }
      );
    }
  
    async compress(file, options = {}) {
      // 添加MIME类型检查
      if (!file.type.startsWith('image/')) {
        return file;
      }
  
      return new Promise((resolve, reject) => {
        this.worker.onmessage = (e) => {
          if (e.data.status === 'success') {
            resolve(e.data.file);
          } else {
            reject(new Error(e.data.error || '压缩失败'));
          }
        };
  
        this.worker.postMessage({
          file,
          options: {
            quality: 0.7,
            maxWidth: 1920,
            maxHeight: 1920,
            convertSize: 500000,
            ...options,
            // 强制使用Worker安全选项
            worker: true  
          }
        }, [file]); // 使用Transferable对象提升性能
      });
    }
  
    terminate() {
      this.worker.terminate();
    }
  }