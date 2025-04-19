<template>
  <div>
    
    <van-nav-bar
    title="管理设置"
    left-text="返回"
    left-arrow
    @click-left="onClickLeft"
  />

    <!-- 人员管理 -->
    <van-cell
      v-if="[0,4,5].includes(roleid)"
      title="人员管理"
      size="large"
      is-link
      to="usermana"
      class="custom-cell"
    />

    <!-- 区域设置 -->
    <van-cell
      v-if="[0,4,5].includes(roleid)"
      title="区域设置"
      size="large"
      is-link
      to="locamana"
      class="custom-cell"
    />

    <!-- 系列价目表版本设置 -->
    <van-cell
      v-if="[0,4,5].includes(roleid)"
      title="项目价目表版本设置"
      size="large"
      is-link
      to="se-proj"
      class="custom-cell"
    />

    <!-- 系列船电缆册 -->
    <van-cell
      v-if="[0,4,5].includes(roleid)"
      title="系列船电缆册"
      size="large"
      is-link
      to="seriesbook"
      class="custom-cell"
    />

    <!-- 电缆定额 -->
    <van-cell
      v-if="[0,4,5].includes(roleid)"
      title="电缆定额"
      size="large"
      is-link
      to="dianlan_baseprice"
      class="custom-cell"
    />

    <!-- 设备定额 -->
    <van-cell
      v-if="[0,4,5].includes(roleid)"
      title="设备定额"
      size="large"
      is-link
      to="ep_baseprice"
      class="custom-cell"
    />

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
const onClickLeft = () => history.back();
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

onMounted(async () => {
  generateImage();
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