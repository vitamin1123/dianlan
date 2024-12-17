<template>
    
    <div class="container">

      <van-row :gutter="[20, 20]">
        
        <van-col span="12" class="list-container">
            <div class="list">
                <van-search v-model="sw_value1" placeholder="搜索区域列表" @search="loca_search"/>
                <van-list :finished="finished" finished-text="">
                <van-swipe-cell v-for="item in leftFilterList"
                :key="item.id">
                <van-cell
                    :title="item.name"
                    @click="leftClick(item)"
                />
                
                </van-swipe-cell>
                </van-list>
            </div>
        </van-col>
  
        <van-col span="12" class="list-container">
        <div class="list">
          <van-search v-model="sw_value2" placeholder="搜索人员列表" @search="loca_item_search" />
          <van-list :finished="finished" finished-text="">
            <van-checkbox-group v-model="checkedValues" ref="checkboxGroup" class="custom-checkbox-group">
              <van-checkbox
                v-for="item in rightFilterList"
                :key="item.code"
                :name="item.code"
                class="custom-checkbox"
              >
                {{ item.name }}
              </van-checkbox>
          </van-checkbox-group>
          </van-list>
        </div>
      </van-col>
      </van-row>
    </div>
    
  </template>
  
  <script setup>
  import { ref,reactive, onMounted, onBeforeUpdate, watch, nextTick   } from 'vue';
  import { showToast,showConfirmDialog  } from 'vant';
  import http from '@/api/request';
  import Pinyin from 'pinyin-match';
  const leftList = ref([]);
  const leftFilterList = ref([])
  
  const sw_value1 = ref('');
  const sw_value2 = ref('');
  const selectedLoca = ref(null);
  const rightList = ref([]);
  const rightFilterList = ref([]);

  const relations = ref([]);

  const checkboxGroup = ref(null);
  const checkedValues = ref([]); 


  const delRight = async(item) => {
    console.log(item);
    showConfirmDialog({
      title: '确认删除',
      message:
        '确认删除区域明细。',
    }).then(async() => {
      // on confirm
      try {
        const response = await http.post('/public/api/area_detail_del', {
          itemid: item.id,
        });
        console.log('请求成功:', response);
        if (response.data.affectedRows > 0) {
          // 刷新列表
          loadRela(selectedLoca.value);
        }
        // 处理返回的数据
      } catch (error) {
        console.error('请求失败:', error);
        // 处理错误
      }
    }).catch(() => {
      // on cancel
    });
   
  };

  

  

  const loca_item_search = (value) => {
    console.log('搜索',value);
    if (value == '') {
      rightFilterList.value = rightList.value;
      return;
    }
    const matches = []
    rightList.value.forEach(item => {
      let metchRes = Pinyin.match(item.name, value);
      if(metchRes)
        matches.push(item)
    });
    console.log(matches);
    rightFilterList.value = matches;
  };
  const loca_search = (value) => {
    console.log('搜索',value);
    if (value == '') {
      leftFilterList.value = leftList.value;
      return;
    }
    const matches = []
    leftList.value.forEach(item => {
      let metchRes = Pinyin.match(item.name, value);
      if(metchRes)
        matches.push(item)
    });
    console.log(matches);
    leftFilterList.value = matches;
  };
  const text = ref(''); 
  const finished = ref(false);
 
 
  watch(checkedValues, (newVal) => {
    console.log('选中的复选框值更新:', newVal);
  });

const loadRela = async (item) => {
  try {
    const response = await http.post('/public/api/loca_user_rela', {
      areaid: item.id,
    });
    relations.value = response.data;
    await nextTick();

    const matchedCodes = rightFilterList.value
      .filter(item => relations.value.some(r => r.code === item.code.toString().trim()))
      .map(item => item.code); // 获取所有匹配到的 code

    checkedValues.value = matchedCodes; // 更新选中值
    console.log('选中复选框的值:', checkedValues.value);
      
    
      
     
   
  } catch (error) {
    console.error('请求失败loadRela:', error);
  }
};

const loadUser = async () => {
  try {
    const response = await http.get('/public/api/locauser_list');
    console.log('请求成功:', response);
    rightList.value = response.data.map(item => ({
      id: item.id,
      name: item.username,
      code: item.usercode,
    }));
    rightFilterList.value = rightList.value;
  } catch (error) {
    console.error('请求失败:', error);
  }
};

  const leftClick = async(item) => {
    console.log(item);
    selectedLoca.value = item;
    loadRela(item);
  }

  const load = async () => {
    try {
      const response = await http.get('/public/api/area_list');

      console.log('请求成功:', response);
      leftList.value = response.data.map(item => ({
        id: item.id,
        name: item.locaname,
      }));
      leftFilterList.value = leftList.value;
      // 处理返回的数据
      if (!selectedLoca.value && leftFilterList.value.length > 0) {
        selectedLoca.value = leftFilterList.value[0];
        loadRela(selectedLoca.value);
      }
    } catch (error) {
      console.error('请求失败:', error);
      // 处理错误
    }
  };
  onMounted(() => {
    console.log("加载啦; ");
    load()
    loadUser()
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
  font-size: 0.4rem; /* 统一文字大小 */
}

.van-row {
  height: 100%;
}

.custom-checkbox-group {
  display: flex;
  flex-direction: column;
}

.custom-checkbox {
  margin-bottom: 12px; /* 每个复选框之间的间距 */
  height: 0.8rem;
  border-bottom: 1px solid #dcdcdc;
}

/* 去掉最后一个复选框的下边距 */
.custom-checkbox:last-child {
  margin-bottom: 0;
}

.van-col:first-child,
.van-col:nth-child(2) {
  margin-bottom: 20px;
}

.van-cell {
  font-size: 0.4rem; /* 确保cell文字大小一致 */
}
  </style>
  