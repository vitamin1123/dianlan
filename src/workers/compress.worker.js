// src/workers/compress.worker.js
import Compressor from 'compressorjs';

// 在Worker中模拟Image对象
class WorkerImage {
  constructor() {
    this.onload = null;
    this.src = null;
    this.width = 0;
    this.height = 0;
  }

  decode() {
    return new Promise((resolve, reject) => {
      const img = new OffscreenCanvas(0, 0);
      const ctx = img.getContext('2d');
      const blob = new Blob([this.src], { type: 'image/png' });
      createImageBitmap(blob).then(bitmap => {
        this.width = bitmap.width;
        this.height = bitmap.height;
        resolve();
      }).catch(reject);
    });
  }
}

// 替换全局Image对象
globalThis.Image = WorkerImage;

self.onmessage = async (e) => {
  const { file, options } = e.data;
  
  new Compressor(file, {
    ...options,
    success(result) {
      self.postMessage({
        status: 'success',
        file: new File([result], file.name, { type: result.type || 'image/jpeg' })
      });
    },
    error(err) {
      self.postMessage({
        status: 'error',
        error: err.message
      });
    }
  });
};