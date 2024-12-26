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
    <van-checkbox-group v-model="checked" ref="checkboxGroup" shape="square" @change="checkChange">
      <van-checkbox 
        v-for ="item in list"
        :key = "item.dianlanid"
        :name="item.id" 
        :disabled="item.fin_user != null || date != todayDate"
        class="checkbox">
      <van-card
        :num="item.num"
        
        :desc="item.model+'  '+ item.specification"
        :title="item.daihao"
        style="--van-card-font-size: 0.4rem;"
        >
        <template #tags>
          <van-tag v-if="item.proj"  type="primary" style="margin-right: 0.1rem;">{{ 'N'+item.proj.substr(-4) }}</van-tag>
            <van-tag v-if="item.facilities && item.facilities.trim() !== ''" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
            <van-tag v-if="item.facilities_loca && item.facilities_loca.trim() !== ''"  color="#ffe1e1" text-color="#ad0000" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
            <van-tag v-if="item.facilities_name && item.facilities_name.trim() !== ''" plain color="#7232dd" style="margin-right: 0.1rem;">{{ item.facilities_name }}</van-tag>
            <van-tag v-if="item.state" color="#008866" >{{ item.fin_user }}</van-tag>
        </template>
        
      </van-card>
    </van-checkbox>
    </van-checkbox-group>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@/store/userStore';
import { showToast,showConfirmDialog  } from 'vant';
import http  from '@/api/request';
const userStore = useUserStore();
const checked = ref([]);
const list = ref([]);
const checkboxGroup = ref(null);
const todayDate = new Date().toLocaleDateString('en-CA').replace(/-/g, '/');  // 替换 - 为 /

const date = ref(todayDate);
const maxDate = ref(new Date());
const minDate = ref(new Date());
minDate.value.setDate(maxDate.value.getDate() - 30);
const show = ref(false);
const previousCheckedValues = ref([]);



const checkChange = async(newCheckedValues) => {
 
  // 判断哪个复选框的状态发生变化，并判断是选中还是取消选中
  const added = newCheckedValues.filter(value => !previousCheckedValues.value.includes(value)); // 新选中的值
  const removed = previousCheckedValues.value.filter(value => !newCheckedValues.includes(value)); // 取消选中的值

  if (added.length > 0) {
    
    showToast(`选中了: ${added[0]}`);
    const res = await http.post('/public/api/search_user_code', {'code': usercode.value});
    console.log('选中了:', added);
  }

  if (removed.length > 0) {
    
    showToast(`取消选中: ${removed[0]}`);
    console.log('取消选中:', removed);
  }

  // 更新 previousCheckedValues 为新的 checkedValues
  previousCheckedValues.value = [...newCheckedValues];
};

const formatDate = (date) => {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};
const onConfirm = (value) => {
 
  show.value = false;
  date.value = formatDate(value);
  console.log('选中日期:', date.value, todayDate );
  load()
};

const checkAll = () => {
  checkboxGroup.value.toggleAll(true);
};

const toggleAll = () => {
  checkboxGroup.value.toggleAll();
};

const load = async () => {
    const res = await http.post('/public/api/get_my_wp_list', { userCode: userStore.userInfo.userCode, qdate: date.value });
    console.log('初次加载： ',res.data)
    list.value = res.data
}

onMounted(() => {
  load()
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
