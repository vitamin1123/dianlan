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
            <van-checkbox-group v-model="checked">
              <van-cell-group inset>
                <van-cell
                  v-for="(item, index) in rightFilterList"
                  :key="item"
                  clickable
                  :title="item.name"
                  @click="toggle(index)"
                >
                  <template #right-icon>
                    <van-checkbox :name="item" :ref="el => checkboxRefs[index] = el"
                        @click.stop/>
                  </template>
                </van-cell>
              </van-cell-group>
            </van-checkbox-group>
          </van-list>
        </div>
      </van-col>
      </van-row>
    </div>
    
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUpdate, watch  } from 'vue';
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

  const checked = ref([]);
  const checkboxRefs = ref([]);
  const relations = ref([]);
  const toggle = (index) => {
    
    checkboxRefs.value[index].toggle();
  };

  onBeforeUpdate(() => {
    
    checkboxRefs.value = [];
  });

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
 
 
  watch(checked, (newVal) => {
  console.log('Checked updated:', newVal);
});

  const loadRela = async (item) => {
  try {
    const response = await http.post('/public/api/loca_user_rela', {
      areaid: item.id,
    });
    console.log('请求成功loadRela:', response);
    relations.value = response.data;

    console.log('relations:', relations.value); // 查看数据结构

    // 直接获取每个relation对象的user字段
    const selectedUserCodes = relations.value.map(relation => relation.user);
    console.log('selectedUserCodes:', selectedUserCodes); // 查看选中的用户代码
    checked.value = [...selectedUserCodes]; // 更新选中的复选框
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
  font-size: 1rem; /* 统一文字大小 */
}

.van-row {
  height: 100%;
}

.van-col:first-child,
.van-col:nth-child(2) {
  margin-bottom: 20px;
}

.van-cell {
  font-size: 0.4rem; /* 确保cell文字大小一致 */
}
  </style>
  