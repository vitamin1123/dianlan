<template>
  <!-- 磁吸导航 -->
  <van-uploader v-show="false" ref="uploader" accept=".xls, .xlsx">
  <van-button icon="plus" type="primary">上传文件</van-button>
</van-uploader>
  
  <div class="container">
    <!-- 左侧部分，占70% -->
    <van-search 
      v-model="sw" 
      placeholder="请输入搜索关键词" 
     
      @search="search_sw" 
    />
    
    <!-- 右侧部分，占30% -->
    <van-popover
      v-model="showPopover"
      theme="dark"
      trigger="click"
      :actions="actions"
      @select="onSelect"
    >
      <template #reference>
        <van-button type="primary">维护</van-button>
      </template>
    </van-popover>
  </div>
    
    <van-popup v-model:show="showTop" position="bottom"  :style="{ height: '50%' }" @click-overlay="showTop = false;">
        <van-form @submit="onSubmit">
            <van-cell-group inset>
                <van-field
                    v-model="sub_model"
                    name="规格"
                    label="规格"
                    placeholder="规格"
                    :rules="[{ required: true, message: '请填写规格' }]"
                />
                <van-field
                    v-model="sub_price"
                    type="number"
                    name="价格"
                    label="价格"
                    placeholder="价格"
                    :rules="[{ required: true, message: '请填写价格' }]"
                />
                
            </van-cell-group>
            <div style="margin: 16px;">
                <van-button round block type="primary" native-type="submit">
                提交
                </van-button>
            </div>
        </van-form>
    </van-popup>
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
        >
        <van-card
        v-for="item in list"
        :price="item.price"
        :title="item.model"
        style="--van-card-font-size: 0.4rem;"
        >
        
        <template #footer>
            <van-button
            size="small"
            >修改</van-button>
            <van-button size="small">删除</van-button>
        </template>
      </van-card>
    </van-list>
    </van-pull-refresh>

    
</template>

<script setup>

import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { showToast } from 'vant'
import Pinyin from 'pinyin-match';
import http from '@/api/request';
const list = ref([])
const page = ref(-1)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false);
const showTop = ref(false)
const sub_model = ref('')
const sub_price = ref('')
const sw = ref('')
const showPopover = ref(false)
const popoverPlacement = ref('left-end')
const actions =  ref([{ text: '直接新增' }, { text: '下载模版' }, { text: '上传文件' }])
const uploader = ref(null);

const search_sw = async () => {
    page.value = -1
    list.value = []
    console.log(sw.value)
    await onLoad()
}

const onSubmit = async () => {
  try {
    console.log(sub_model.value, sub_price.value);
    const res = await http.post('/public/api/dianlan_baseprice_submit', {
      model: sub_model.value,
      price: sub_price.value,
    });

    // 成功处理
    if (res.data.affectedRows === 1) {
      showToast('提交成功');
      showTop.value = false;
      await onLoad();
    } else {
      // 后端返回的错误信息
      showToast(`提交失败: ${res.data.message}`);
    }
  } catch (error) {
    // 捕获请求或服务器的错误
    const errorMessage = error.response?.data?.message || '网络错误，请稍后再试';
    showToast(`提交失败: ${errorMessage}`);
  }
};

const onSelect=async(action) => {
  showToast(action.text);
  if (action.text == '直接新增') {
    showTop.value = true
  }else if (  action.text == '下载模版') {
    // 下载模版
  }else if (  action.text == '上传文件') {
    // 上传文件
    await nextTick(); // 确保 DOM 已经更新
    const inputElement = uploader.value.$el.querySelector('input[type="file"]');
    if (inputElement) {
      inputElement.click();
    }
  }
}

const onRefresh = () => {
      // 清空列表数据
      finished.value = false;
      page.value = 0; // 重置页码
      // 清空列表数据
      list.value = [];
      // 重新加载数据
      // 将 loading 设置为 true，表示处于加载状态
      loading.value = true;
      onLoad();
  };

const onLoad = async () => {
        
        page.value++; // 增加页码 
        
        if (refreshing.value) {
          page.value = 0
          list.value = [];
          refreshing.value = false;
        }
        
        const responseData = await fetchData();
        if (!responseData) {
          loading.value = false; // 确保加载状态被重置
          return;
        }
        console.log('返回电缆值：', responseData.totalCount,responseData.data);
        for (let i = 0; i < responseData.data.length; i++) {
          list.value.push(responseData.data[i]);
        }
        loading.value = false;

        if (list.value.length >= responseData.totalCount) {
          finished.value = true;
        }
      
    };

const fetchData = async () => {
    loading.value = true
    const res = await http.post('/public/api/dianlan_baseprice', {
            page: page.value*10,
            sw: sw.value
    })
    // list.value = res.data
    
    // loading.value = false
    return res
}


onMounted( async() => {
    
    await onLoad();
    console.log("首页加载啦; ");
 
  })

</script>

<style scoped>

.container {
  display: flex; /* 使用 Flex 布局 */
  align-items: center; /* 垂直居中 */
  justify-content: space-between; /* 左右分布 */
  gap: 10px; /* 左右之间间距 */
  z-index: 10; 
  position: sticky; 
  top: 0;
}

.container > :first-child {
  flex: 80%; /* 左侧占70% */
}

.container > :last-child {
  flex: 20%; /* 右侧占30% */
  display: flex;
  margin-right: 0.3rem;
  justify-content: flex-end; /* 按钮在右对齐 */
}
</style>