// 使用pinia创建一个用户信息的store
import { defineStore } from 'pinia'
export const useDaibanStore = defineStore('daiban', {
  state: () => {
    return {
      gongdan: 0,
      daiban: 0,
    }
  }
})
