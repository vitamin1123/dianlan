import axios from "axios"
import { baseURL } from "./my-account";
import { useUserStore } from '@/store/userStore';
// import { useRouter } from "vue-router";
const http = axios.create({
    baseURL,
    timeout:3000
}
);

http.interceptors.request.use(config => {
    const userStore = useUserStore();
    const token = userStore.userInfo.userToken;

    // 如果 userToken 存在，则添加 Authorization 头
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config
}, error => {
    return Promise.reject(error)
});

http.interceptors.response.use(response => {
    const userStore = useUserStore();
    // console.log('拦截器的response：',response);
    if (response.data && response.data.code === 50001) {
        // 清除用户信息和 token
        userStore.setToken(null);
        userStore.setUserInfo({});

        // 跳转到登录页面
        window.location.href = "/login";

        // 手动抛出错误，通知调用者处理
        return Promise.reject(new Error("用户鉴权失败"));
    }
    if (response.config.responseType === 'blob') {
        return response; // 保留整个响应对象
    }
    return response.data; // 默认行为
}, error => {
    return Promise.reject(error);
});


export default {
    get(url, params) {
        return http.get(url, { params })
    },
    post(url, data) {
        return http.post(url, data)
    } 
};