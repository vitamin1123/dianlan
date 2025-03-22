<template>
    <div class="login-page">
      <!-- 图片展示 -->
      <div class="image-container">
        <van-image
          width="2rem"
          height="2rem"
          fit="cover"
          :src="imageSrc"
        />
      </div>
  
      <!-- 登录表单 -->
      <van-form>
        <!-- 工号输入 -->
        <van-field
          v-model="workId"
          label="工号"
          placeholder="请输入工号"
          required
          @blur="fetchUsername"
        />
  
        <!-- 用户名展示 -->
        <van-field
          v-model="username"
          label="用户名"
          readonly
          placeholder="请输入工号以查询"
        />
  
        <!-- 密码输入 -->
        <van-field
          v-model="password"
          type="password"
          label="密码"
          placeholder="请输入密码"
          required
        />
  
        <!-- 修改密码按钮 -->
        <div class="change-password">
          <van-button type="primary" size="large" round @click="showPopup = true">
            修改密码
          </van-button>
        </div>
  
        <!-- 提交按钮 -->
        <div style="margin-top: 16px;">
          <van-button round block type="info" native-type="submit" @click="login_sub">
            登录
          </van-button>
        </div>
      </van-form>
  
      <!-- 修改密码弹窗 -->
      <van-popup v-model:show="showPopup" position="center" round>
        <div class="popup-content">
          
          <!-- 工号 -->
          <van-field
            v-model="popupWorkId"
            label="工号"
            placeholder="请输入工号"
          />
          <!-- 原密码 -->
          <van-field
            v-model="oldPassword"
            type="password"
            label="原密码"
            placeholder="请输入原密码"
          />
          <!-- 新密码 -->
          <van-field
            v-model="newPassword"
            type="password"
            label="新密码"
            placeholder="请输入新密码"
          />
          <!-- 确认密码 -->
          <van-field
            v-model="confirmPassword"
            type="password"
            label="确认密码"
            placeholder="请再次输入新密码"
          />
          <!-- 提交按钮 -->
          <van-button
            type="primary"
            block
            style="margin-top: 16px;"
            @click="submitPasswordChange"
          >
            提交
          </van-button>
        </div>
      </van-popup>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { showToast } from 'vant';
  import http  from '@/api/request';
  import base64 from 'base-64';
  import { useUserStore } from '@/store/userStore';
  const userStore = useUserStore();
  
  // 登录相关响应式数据
  const workId = ref('');
  const username = ref('');
  const password = ref('');
  const imageSrc = ref('');
  const text = ref('汉字'); // 图片中要展示的文字
  
  // 修改密码相关响应式数据
  const showPopup = ref(false);
  const popupWorkId = ref('');
  const oldPassword = ref('');
  const newPassword = ref('');
  const confirmPassword = ref('');
  
  // 查询用户名
  const fetchUsername = async () => {
    if (!workId.value) {
      showToast('请输入工号');
      return;
    }
  
    try {
      const response = await http.post('/public/api/get_user_name', {
        usercode: workId.value,
      });
      console.log('请求成功:', response);
      
      username.value = response.userName?response.userName:'系统未录入';
      text.value = response.userName?response.userName[0]:'无';
      // 生成图片
      generateImage();
      // 处理返回的数据
    } catch (error) {
      console.error('请求失败:', error);
      // 处理错误
    }
  };
  // 登陆
  const login_sub = async () => {
    if (!workId.value || !password.value || username.value=='系统未录入') {
      showToast('请输入工号和密码');
      return;
    }

    try {
      const encryptedPassword = base64.encode(password.value);
      const response = await http.post('/api/user/login', {
        name: workId.value,
        password: encryptedPassword,
      });  
      console.log('请求成功:', response.status);
      if(response.code==200){
        // userStore.setUserInfo(response.data);
        const token = response.data.token;
        userStore.setToken(token);
        // window.location.href = '/';
        window.location.href = `/?token=${token}`;
      }else if (response.code==401){
        showToast('用户名或密码错误');
      }else{
        showToast('系统错误');
      }
      // 处理返回的数据
    } catch (error) {
      console.error('请求失败:', error);
      // 处理错误
    }
  };
  
  // 提交修改密码
  const submitPasswordChange = async() => {
    if (!popupWorkId||!oldPassword.value || !newPassword.value || !confirmPassword.value) {
      showToast('请完整填写信息');
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      showToast('两次输入的新密码不一致');
      return;
    }
    // 模拟提交逻辑
    try {
      const encryptedPassword = base64.encode(oldPassword.value);
      const encryptedNewPassword = base64.encode(newPassword.value);
      const response = await http.post('/public/api/user/change_pwd', {
        workId: popupWorkId.value,
        oldPassword: encryptedPassword,
        newPassword: encryptedNewPassword,
      });
      console.log('请求成功:', response);
      if(response.code==200){
        showToast('密码修改成功');
        showPopup.value = false; // 关闭弹窗
      }else if (response.code==401){
        showToast('原密码错误');
      }else{
        showToast('系统错误');
      }
    } catch (error) {
      console.error('请求失败:', error);
    }
    showToast.success('密码修改成功');
    showPopup.value = false; // 关闭弹窗
  };
  
  // 生成图片
  const generateImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    // 设置 Canvas 尺寸
    canvas.width = 130;
    canvas.height = 130;
  
    // 设置背景颜色
    ctx.fillStyle = '#add8e6'; // 浅蓝色背景
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // 设置字体和样式
    ctx.fillStyle = '#ffffff'; // 白色文字
    ctx.font = '80px Arial'; // 字体大小和样式
    ctx.textAlign = 'center'; // 水平居中
    ctx.textBaseline = 'middle'; // 垂直居中
  
    // 绘制汉字
    ctx.fillText(text.value, canvas.width / 2, canvas.height / 2);
  
    // 导出图片为 Data URL
    imageSrc.value = canvas.toDataURL('image/png');
  };
  
  // 提交表单

  // 表单验证失败

  </script>
  
  <style scoped>
  .login-page {
    padding: 20px;
  }
  
  .image-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }
  
  .popup-content {
    padding: 20px;
  }
  
  h3 {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .change-password {
    margin: 16px 0;
    text-align: right;
  }
  </style>
  