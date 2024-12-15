<template>
  <div class="container">
    <div class="header">
      <p>今日工作包</p>
      <div class="button-group">
        <van-button type="primary" @click="checkAll">全选</van-button>
        <van-button type="primary" @click="toggleAll">反选</van-button>
      </div>
    </div>
    <van-checkbox-group v-model="checked" ref="checkboxGroup">
      <van-checkbox name="a" class="checkbox">复选框 a</van-checkbox>
      <van-checkbox name="b" class="checkbox">复选框 b</van-checkbox>
      <van-checkbox name="c" class="checkbox">复选框 c</van-checkbox>
    </van-checkbox-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/userStore';

const userStore = useUserStore();
const checked = ref([]);
const checkboxGroup = ref(null);

const checkAll = () => {
  checkboxGroup.value.toggleAll(true);
};

const toggleAll = () => {
  checkboxGroup.value.toggleAll();
};

onMounted(() => {
  console.log("首页加载啦; ", userStore.userInfo);
});
</script>

<style scoped>
.container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

p {
  font-size: 1rem;
  margin: 0;
}

.button-group {
  display: flex;
  gap: 15px;
}

.checkbox {
  /* display: block; */
  margin-bottom: 10px;
  padding: 10px 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  line-height: 2; /* 提高复选框内容的高度 */
  font-size: 0.8rem;
}
</style>
