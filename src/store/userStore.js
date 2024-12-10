// 使用pinia创建一个用户信息的store
import { defineStore } from 'pinia'
export const useUserStore = defineStore('user', {
  state: () => {
    return {
      userInfo: {
        userCode: '',
        userName: '',
        userRole: 999,
        userToken: ''
      }
    }
  }
})
