<template>
    <van-popup v-model:show="showTop" position="top" :style="{ height: '50%' }" > 
        <van-search v-model="search_word" placeholder="请输入" show-action  @search="search"/>
        <van-list>
            <van-cell v-for="item in list" :key="item.id" :title="item.name" @click="select(item)"/>
        </van-list>
    </van-popup>
    <div class="button-container">
    <van-button type="primary" plain @click="handleClick">
        {{ button_text }}
    </van-button>
    <van-uploader accept=".xls, .xlsx">
        <van-button icon="plus" type="primary" >上传电缆册</van-button>
    </van-uploader>

</div>
</template>

<script setup>

import { ref, onMounted } from 'vue';
import http from '@/api/request';
const showTop = ref(false);
const search_word = ref('');
const list = ref([]);
const proj_list = ref([]);
const button_text = ref('系列船');
const handleClick = () => {
    showTop.value = true;
};

const select = (item) => {
    button_text.value = item.name;
    showTop.value = false;
};

const search = async () => {
    try {
      const response = await http.post('/public/api/search_proj_list',{sw: search_word.value});

      console.log('请求成功:', response);
      list.value = response.data.map(item => ({
        id: item.id,
        name: item.projname,
      }));
     

      
    } catch (error) {
      console.error('请求失败:', error);
      // 处理错误
    }
};

onMounted(() => {
    list.value = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
});

</script>

<style scoped>
.button-container {
  display: flex;
  justify-content: space-between; /* 将按钮分散到两端 */
  align-items: center; /* 垂直居中对齐按钮 */
}

.van-button {
  margin: 0 10px; /* 给按钮添加一点间距，避免紧挨着 */
}
</style>