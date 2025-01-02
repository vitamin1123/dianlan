<template>
    <van-popup v-model:show="showTop" position="top" :style="{ height: '20%' }" >

      
        
          <van-field
            v-model="text"
            :label="'请输入' + (addType == 0 ? '系列' : '项目')"
            :placeholder="'请输入' + (addType == 0 ? '系列' : '项目')"
            clearable
            style = "margin-top: 10px;"
          />
          <van-button type="primary" block @click="confirmAdd" style="margin-top: 1rem;">确认添加</van-button>
    </van-popup>
    <div class="container">

      <van-row :gutter="[20, 20]">
        <!-- 顶部按钮部分 -->
        <van-col span="12">
          <van-button type="primary" block @click="addLoca">增加系列</van-button>
        </van-col>
        <van-col span="12">
          <van-button type="success" block @click="addLocaItem">增加项目</van-button>
        </van-col>
  
        <!-- 底部列表部分 -->
        <van-col span="12" class="list-container">
            <div class="list">
                <van-search v-model="sw_value1" placeholder="搜索项目列表" @search="loca_search"/>
                <van-list :finished="finished" finished-text="" @load="loadMore">
                <van-swipe-cell v-for="item in leftFilterList"
                :key="item.id">
                <van-cell
                    :title="item.name"
                    @click="leftClick(item)"
                    :style="{ color: item.id === selectedLoca.id ? 'red' : 'black' }"
                />
                <template #right>
                    <van-button square type="danger" text="删除" @click="delLeft(item)"/>
                    <van-button square type="primary" text="修改" @click="modLeft(item)"/>
                </template>
                </van-swipe-cell>
                </van-list>
            </div>
        </van-col>
  
        <van-col span="12" class="list-container">
       <div class="list">
          <!-- <p class="list-title">项目列表</p> -->
            <van-search v-model="sw_value2" placeholder="搜索项目列表" @search="loca_item_search"/>
            <van-list :finished="finished" finished-text="" @load="loadMore">
            <van-swipe-cell v-for="item in rightFilterList" :key="item.id">
              <van-cell :title="item.name" />
              <template #right>
                <van-button square type="danger" text="删除" @click="delRight(item)"/>
                <van-button square type="primary" text="修改" @click="modRight(item)" />
              </template>
            </van-swipe-cell>
            </van-list>
          </div>
        </van-col>
      </van-row>
    </div>
    <van-dialog v-model:show="modshow" title="修改名称" show-cancel-button :confirmButtonDisabled="modvalue.length>0?false:true" @confirm="confirmMod">
      <van-field v-model="modvalue" :label="oriValue" placeholder="请输入名称" maxlength="45"/>
    </van-dialog>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { showToast,showConfirmDialog  } from 'vant';
  import http from '@/api/request';
  import Pinyin from 'pinyin-match';
  const leftList = ref([
    { id: 1, name: '网络不佳' },
  ]);
  const leftFilterList = ref([])
  
  const sw_value1 = ref('');
  const sw_value2 = ref('');
  const selectedLoca = ref(null);
  const showTop = ref(false);
  const addType = ref(0)
  const rightList = ref([]);
  const rightFilterList = ref([]);
  const modType = ref(0);
  const modvalue = ref('');
  const modshow = ref(false);
  const oriValue = ref('');
  const modRightItem = ref('')
  const delLeft = async(item) => {
    showConfirmDialog({
      title: '确认删除',
      message:
        '如果删除系列，项目也一并删除。',
    })
      .then(async() => {
        // on confirm
        try {
          const response = await http.post('/public/api/area_del', {
            projid: item.id,
          });
          console.log('请求成功:', response);
          if (response.data.affectedRows > 0) {
            // 刷新列表
            load();
          }
          // 处理返回的数据
        } catch (error) {
          console.error('请求失败:', error);
          // 处理错误
        }
      })
      .catch(() => {
        // on cancel
      });
    
  };

  const delRight = async(item) => {
    console.log(item);
    showConfirmDialog({
      title: '确认删除',
      message:
        '确认删除系列项目。',
    }).then(async() => {
      // on confirm
      try {
        const response = await http.post('/public/api/proj_detail_del', {
          itemid: item.id,
        });
        console.log('请求成功:', response);
        if (response.data.affectedRows > 0) {
          // 刷新列表
          loadDetails(selectedLoca.value);
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

  const modRight = async(item) => {
    oriValue.value = item.name;
    modRightItem.value = item;
    modType.value = 1;
    modshow.value = true;
    console.log(item,item.id);
  };

  const modLoca = async() => {
    try {
      const response = await http.post('/public/api/proj_mod', {
        projid: selectedLoca.value.id,
        locaname: modvalue.value,
      });
      console.log('请求成功:', response);
      if (response.data.affectedRows > 0) {
        // 刷新列表
        load();
      }
      // 处理返回的数据
    } catch (error) {
      console.error('请求失败:', error);
      // 处理错误
    }
  };

  const modLocaItem = async() => {
    try {
      const response = await http.post('/public/api/proj_detail_mod', {
        itemid: modRightItem.id,
        itemname: modvalue.value,
      });
      console.log('请求成功:', response);
      if (response.data.affectedRows > 0) {
        // 刷新列表
        loadDetails(selectedLoca.value);
      }
      // 处理返回的数据
    } catch (error) {
      console.error('请求失败:', error);
      // 处理错误
    }
  };

  const confirmMod = async() => {
    if (modType.value == 0) {
        // 系列
        await modLoca();
      } else {
        // 项目
        await modLocaItem();
      }
    
  };

  const modLeft = async(item) => {
    oriValue.value = item.name;
    selectedLoca.value = item;
    modType.value = 0;
    modshow.value = true;
    console.log(item,item.id);
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
  const confirmAdd = async () => {
    if (addType.value == 0) {
        try {
        const response = await http.post('/public/api/proj_add', {
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
        const response = await http.post('/public/api/proj_detail_add', {
            projid: selectedLoca.value.id,
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
      showToast('请选择系列再添加项目');
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
    const response = await http.post('/public/api/proj_detail_list', {
        projid: item.id,
    });
    console.log('请求成功:', response);
    rightList.value = response.data.map(item => ({
      id: item.id,
      name: item.itemname,
    }));
    rightFilterList.value = rightList.value;
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
      const response = await http.get('/public/api/proj_list');

      console.log('请求成功:', response);
      leftList.value = response.data.map(item => ({
        id: item.id,
        name: item.projname,
      }));
      leftFilterList.value = leftList.value;
      // 处理返回的数据
      if (!selectedLoca.value && leftFilterList.value.length > 0) {
        selectedLoca.value = leftFilterList.value[0];
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
    height: calc(90vh - 100px); /* 减去按钮系列的高度 */
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
  