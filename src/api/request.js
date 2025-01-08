import axios from "axios"
import { baseURL } from "./my-account";

const http = axios.create({
    baseURL,
    timeout:3000
}
);

http.interceptors.request.use(config => {
    return config
}, error => {
    return Promise.reject(error)
});

// http.interceptors.response.use(response => {
//     return response.data
// }, error => {
//     return Promise.reject(error)
// });
http.interceptors.response.use(response => {
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