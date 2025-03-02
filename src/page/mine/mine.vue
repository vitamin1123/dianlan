<template>
  <div>
    <div v-if="imageSrc">
      <!-- <img :src="imageSrc" alt="汉字图片" /> -->
    </div>

    <!-- 用户信息单元格 -->
    <van-cell title="单元格" size="large" style="margin-top: 1rem;">
      <template #title>
        <div class="container">
          <van-image
            width="2.5rem"
            height="2.5rem"
            fit="cover"
            :src="imageSrc"
            
            class="user-avatar"
          />
          <div class="text-content">
            <p class="name">{{ username }}</p>
            <p class="role">{{ rolename }}</p>
          </div>
        </div>
      </template>
    </van-cell>

    <!-- 其他单元格 -->
    <div class="cell-container">
      <van-cell
        v-if="[0,4,5].includes(roleid)"
        title="拉线完成"
        size="large"
        is-link
        to="work"
        class="custom-cell"
      />
      <van-cell
        v-if="[0,4,5].includes(roleid)"
        title="接线派工"
        size="large"
        is-link
        to="work1"
        class="custom-cell"
      />
      <van-cell
        v-if="[0,4,5].includes(roleid)"
        title="当日审核"
        size="large"
        is-link
        to="mywp"
        class="custom-cell"
      >
        <template #value>
          <van-tag type="danger">{{ daibanStore.daiban }} 待办</van-tag>
        </template>
      </van-cell>
      <van-cell
        title="当日产值"
        size="large"
        is-link
        to="index"
        class="custom-cell"
      />
      <van-cell
        v-if="[0,4,5].includes(roleid)"
        title="统计"
        size="large"
        is-link
        to="myana-laxian"
        class="custom-cell"
      />
      <van-cell
        v-if="[0,5].includes(roleid)"
        title="管理设置"
        size="large"
        is-link
        to="mine_dt"
        class="custom-cell"
      />
    </div>

    <canvas ref="canvas" width="100" height="100" style="display: none;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/request';
import { useUserStore } from '@/store/userStore';
import { useDaibanStore } from '@/store/daibanStore';

const userStore = useUserStore();
const daibanStore = useDaibanStore();
const text = ref(userStore.userInfo.userName[0]); // 存储输入的汉字
const imageSrc = ref(''); // 存储生成的图片 URL
const username = ref(userStore.userInfo.userName);
const rolename = ref(userStore.userInfo.userRoleName);
const roleid = ref(userStore.userInfo.userRole);

const generateImage = () => {
  const canvas = document.createElement('canvas'); // 或使用 refs 获取 canvas
  const ctx = canvas.getContext('2d');

  // 设置 Canvas 尺寸
  canvas.width = 130;
  canvas.height = 130;

  // 清空画布并设置背景颜色为浅蓝色
  ctx.fillStyle = '#add8e6'; // 浅蓝色背景
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 设置字体和样式
  ctx.fillStyle = '#ffffff'; // 白色文字
  ctx.font = '80px Arial'; // 字体大小和样式
  ctx.textAlign = 'center'; // 居中对齐
  ctx.textBaseline = 'middle'; // 垂直居中

  // 绘制汉字
  ctx.fillText(text.value, canvas.width / 2, canvas.height / 2);

  // 导出图片为 Data URL
  imageSrc.value = canvas.toDataURL('image/png');
};

const get_wp_todo_cnt = async () => {
  const res = await http.post('/api/get_paip_wp_todo_cnt', { userCode: userStore.userInfo.userCode });
  console.log('代办数量： ', res.data);
  daibanStore.daiban = res.data;
};

onMounted(async () => {
  generateImage();
  get_wp_todo_cnt();
});
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
}

.user-avatar {
  border: 2px solid #fff; /* 头像边框 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 头像阴影 */
}

.text-content {
  margin-left: 1rem; /* 设置图片和文字之间的间距 */
}

.name {
  font-size: 0.6rem; /* 调整名字的字体大小 */
  font-weight: bold; /* 加粗名字 */
  margin: 0; /* 去除默认边距 */
  color: #333; /* 深灰色文字 */
}

.role {
  font-size: 0.4rem; /* 调整角色的字体大小 */
  color: #666; /* 灰色文字 */
  margin: 0; /* 去除默认边距 */
}

/* 其他单元格容器 */
.cell-container {
  width: 90%;
  margin: 0 auto; /* 居中 */
}

.custom-cell {
  margin: 0.2rem 0; /* 单元格间距 */
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 阴影 */
  background-color: #fff; /* 背景色 */
}

.custom-cell:hover {
  background-color: #f7f8fa; /* 鼠标悬停时的背景色 */
}
</style>