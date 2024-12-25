<template>
  <div class="container">
    <div class="header">
      <van-cell title="工单日期" :value="date" @click="show = true" style="width:55%"/>
      <van-calendar v-model:show="show" :min-date="minDate" :max-date="maxDate" @confirm="onConfirm" />
      <div class="button-group">
        <van-button type="primary" @click="checkAll">全选</van-button>
        <van-button type="primary" @click="toggleAll">反选</van-button>
      </div>
    </div>
    <van-checkbox-group v-model="checked" ref="checkboxGroup" shape="square">
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
const list = ref([]);
const checkboxGroup = ref(null);

const date = ref(new Date().toISOString().slice(0, 10));
const maxDate = ref(new Date());
const minDate = ref(new Date());
minDate.value.setDate(maxDate.value.getDate() - 30);
const show = ref(false);

const formatDate = (date) => {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};
const onConfirm = (value) => {
  show.value = false;
  date.value = formatDate(value);
};

const checkAll = () => {
  checkboxGroup.value.toggleAll(true);
};

const toggleAll = () => {
  checkboxGroup.value.toggleAll();
};

const load = async () => {
    const res = await http.post('/public/api/get_my_wp_list', { userCode: userStore.userInfo.userCode });
    console.log('初次加载： ',res.data)
    list.value = res.data
}

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
