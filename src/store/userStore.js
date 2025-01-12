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
  },
  actions: {
    setToken(token) {
      this.userInfo.userToken = token;
    },
    setUserInfo(userInfo) {
      this.userInfo.userCode = userInfo.userCode;
      this.userInfo.userName = userInfo.userName;
      this.userInfo.userRole = userInfo.userRole;
    }
  }
})
