<template>
    <van-popup v-model:show="showTop" position="top" :style="{ height: '20%' }" >

      
        
          <van-field
            v-model="text"
            :label="'请输入' + (addType == 0 ? '区域' : '明细')"
            :placeholder="'请输入' + (addType == 0 ? '区域' : '明细')"
            clearable
            style = "margin-top: 10px;"
          />
          <van-button type="primary" block @click="confirmAdd" style="margin-top: 1rem;">确认添加</van-button>
    </van-popup>
    <div class="container">

      <van-row :gutter="[20, 20]">
        <!-- 顶部按钮部分 -->
        <van-col span="12">
          <van-button type="primary" block @click="addLoca">增加区域</van-button>
        </van-col>
        <van-col span="12">
          <van-button type="success" block @click="addLocaItem">加明细</van-button>
        </van-col>
  
        <!-- 底部列表部分 -->
        <van-col span="12" class="list-container">
          <div class="list">
            <p class="list-title">区域列表</p>
            <van-list :finished="finished" finished-text="没有更多了" @load="loadMore">
              <van-cell
                v-for="item in leftList"
                :key="item.id"
                :title="item.name"
                @click="leftClick(item)"
              />
            </van-list>
          </div>
        </van-col>
  
        <van-col span="12" class="list-container">
          <div class="list">
            <p class="list-title">明细列表</p>
            <van-list :finished="finished" finished-text="没有更多了" @load="loadMore">
              <van-cell
                v-for="item in rightList"
                :key="item.id"
                :title="item.name"
                
              />
            </van-list>
          </div>
        </van-col>
      </van-row>
    </div>
  </template>
  
  <script setup>
  import { ref,onMounted } from 'vue';
  import { showToast } from 'vant';
  import http from '@/api/request';
  const leftList = ref([
    { id: 1, name: '选项 A' },
    { id: 2, name: '选项 B' },
    { id: 3, name: '选项 C' },
  ]);
  
  const selectedLoca = ref(null);
  const showTop = ref(false);
  const addType = ref(0)
  const rightList = ref([
    
  ]);
  const text = ref(''); 
  const finished = ref(false);
  const confirmAdd = async () => {
    if (addType.value == 0) {
        try {
        const response = await http.post('/public/api/area_add', {
            locaname: text.value,
        });
        console.log('请求成功:', response);
        
        if (response.data.affectedRows > 0) {
            // 刷新列表
            showTop.value = false;
            load();
        }
        // 如果返回状态码是 200，表示添加成功
        showToast({
            type: 'success',
            message: '添加成功！',
            duration: 2000, // 持续时间
        });
        } catch (error) {
        console.error('请求失败:', error);

        // 判断是否是 HTTP 错误并根据状态码处理
        if (error.response && error.response.status === 400) {
            // 后端返回 400 错误，显示具体错误信息
            showToast({
            type: 'fail',
            message: error.response.data.message || '添加失败，数据已存在！',
            duration: 2000,
            });
        } else {
            // 其他错误情况，显示通用错误消息
            showToast({
            type: 'fail',
            message: '请求失败，请稍后重试！',
            duration: 2000,
            });
        }
        }
    }else{
      try {
        const response = await http.post('/public/api/area_detail_add', {
            areaid: selectedLoca.value.id,
            itemname: text.value,
        });
        console.log('请求成功:', response);
        if (response.data.affectedRows > 0) {
            // 刷新列表
            showTop.value = false;
            loadDetails(selectedLoca.value);
        }
        
        // 处理返回的数据
      } catch (error) {
        console.error('请求失败:', error);
        // 处理错误
      }
  }
}
  const addLocaItem = async () => {
    if (!selectedLoca.value) {
      showToast('请选择区域再添加明细');
      return;
    }
    addType.value = 1;
    showTop.value = true;
    
  }
  const addLoca = async () => {
    showTop.value = true;
    
  }
  
  const loadMore = () => {
    setTimeout(() => {
      finished.value = true;
    }, 1000);
  };

  const loadDetails = async (item) => {
  try {
    const response = await http.post('/public/api/area_detail_list', {
      areaid: item.id,
    });
    console.log('请求成功:', response);
    rightList.value = response.data.map(item => ({
      id: item.id,
      name: item.itemname,
    }));
  } catch (error) {
    console.error('请求失败:', error);
  }
};

  const leftClick = async(item) => {
    console.log(item);
    selectedLoca.value = item;
    loadDetails(item);
  }

  const load = async () => {
    try {
      const response = await http.get('/public/api/area_list');

      console.log('请求成功:', response);
      leftList.value = response.data.map(item => ({
        id: item.id,
        name: item.locaname,
      }));
      // 处理返回的数据
      if (!selectedLoca.value && leftList.value.length > 0) {
        selectedLoca.value = leftList.value[0];
        loadDetails(selectedLoca.value);
      }
    } catch (error) {
      console.error('请求失败:', error);
      // 处理错误
    }
  };
  onMounted(() => {
    console.log("加载啦; ");
    load()
})

  </script>
  
  <style scoped>
  .container {
    height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  .list-container {
    height: calc(90vh - 100px); /* 减去按钮区域的高度 */
    display: flex;
    flex-direction: column;
  }
  
  .list {
    flex: 1;
    border: 1px solid #dcdcdc;
    border-radius: 10px;
    padding: 10px;
    overflow: auto;
  }
  
  .list-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
    text-align: center;
  }
  
  .van-row {
    height: 100%;
  }
  
  .van-col:first-child,
  .van-col:nth-child(2) {
    margin-bottom: 20px;
  }
  </style>
  