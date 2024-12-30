<template>
    <div style="margin-bottom: 1rem;">
      <van-swipe-cell v-for="(item, index) in list">
        <van-card
          :num="item.num"
          :desc="item.model + '  ' + item.specification"
          :tag="item.proj.substr(-4)"
          :title="item.daihao"
          style="--van-card-font-size: 0.4rem;"
        >
          <template #tags>
            <van-tag v-if="item.facilities" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
            <van-tag v-if="item.facilities_loca" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
            <van-tag v-if="item.facilities_name" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities_name }}</van-tag>
            <van-tag >{{ item.formattedWpdate }}</van-tag>
          </template>
        </van-card>
  
        <template #right>
          <div class="button-container">
            <van-button square type="danger" text="删除" @click="delCart(index)" class="delete-button" />
            <van-button square type="warning" text="修改" @click="delCart(index)" class="delete-button" />
          </div>
        </template>
      </van-swipe-cell>
    </div>
  </template>
  
<script setup>
import { ref, onMounted, computed } from 'vue';
import http  from '@/api/request';
import { useUserStore } from '@/store/userStore';
const userStore = useUserStore();

const list = ref([])


  

const load = async () => {
    const res = await http.post('/public/api/get_paip_wp_list', { userCode: userStore.userInfo.userCode });
    console.log('初次加载： ',res.data)
    list.value = res.data.map(item => {
        const date = new Date(item.wpdate);
        const datePart = date.toISOString().split('T')[0];  // 获取 "2024-12-30"
        const timePart = date.toISOString().split('T')[1].slice(0, 5);  // 获取 "14:29"
        return {
            ...item,
            formattedWpdate: `${datePart} ${timePart}`  // 新增格式化字段
        };
    });
   
}


onMounted(() => {
    load()
})

</script>
<style scoped>

.button-container {
  display: flex;
  flex-direction: column; /* 上下排列 */
  justify-content: space-between; 
  height: 100%; /* 占满父容器的高度 */
}


</style>
  