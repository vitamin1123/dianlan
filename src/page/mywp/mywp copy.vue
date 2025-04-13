<template>
  <van-nav-bar
      title="确认工单"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />
  <div class="header">
      <van-cell title="工单日期" :value="date" @click="show = true" style="width:100%" />
      
      <van-calendar v-model:show="show" :min-date="minDate" :max-date="maxDate" @confirm="onConfirm" />
    </div>
  <div style="margin-bottom: 1rem;">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div
          v-for="(group, index) in groupedByWpid"
          :key="index"
          class="wpid-group"
        >
          <div class="wpid-group-header"></div>
          <van-card
            v-for="(item, idx) in group.items"
            :key="idx"
            :num="item.num"
            :desc="item.model + '  ' + item.specification"
            :tag="item.proj.substr(-4)"
            :title="item.daihao"
            class="wpid-card"
          >
            <template #tags>
              <van-tag v-if="item.facilities" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
              <van-tag v-if="item.facilities_loca" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
              <van-tag v-if="item.facilities_name" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities_name }}</van-tag>
              <van-tag v-if="item.last_fangxian_loca_name"  color="#b27f3d" style="margin-right: 0.1rem;">{{ item.last_fangxian_loca_name }}</van-tag>
              <van-tag v-if="item.fin_user_name"  type="warning" style="margin-right: 0.1rem;">{{ "接线："+item.fin_user_name }}</van-tag>
             
              <!-- <van-tag>{{ item.formattedWpdate }}</van-tag> -->
            </template>
          </van-card>
          <div class="button-container">
          <!-- 左侧的 tags -->
          <div class="user-tags">
            <van-tag
              v-for="(user, userIndex) in group.users"
              :key="userIndex"
              size="small"
              color="#676161"
              class="custom-tag"
            >
              {{ user }}
            </van-tag>
          </div>

          <!-- 右侧的 buttons -->
          <div class="button-group">
            <van-button type="primary" size="small" :disabled="group.state==1" @click="del_wp(group.wpid)" style="margin-right: 0.1rem;">
              删除
            </van-button>
            <van-button type="success" size="small" :plain="group.state==1" @click="confirm_wp(group.wpid)">
              {{ group.state==1?'取消':'确认' }}
            </van-button>
          </div>
        </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import http from '@/api/request';
import { showNotify } from 'vant';
import { showConfirmDialog } from 'vant';
import { useUserStore } from '@/store/userStore';
import { useDaibanStore } from '@/store/daibanStore'
const userStore = useUserStore();
const daibanStore = useDaibanStore();
const list = ref([]);
const todayDate = new Date().toLocaleDateString('en-CA').replace(/-/g, '/'); 
const date = ref(todayDate);
const show = ref(false);
const maxDate = ref(new Date());
const minDate = ref(new Date());
minDate.value.setDate(maxDate.value.getDate() - 30);
const formatDate = (date) => {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

const onClickLeft = () => history.back();

const onConfirm = async(value) => {
 
 show.value = false;
 date.value = formatDate(value);
 console.log('选中日期:', date.value, todayDate );
 list.value = [];
 page.value = 0;
 await onLoad()
//  load()
};
const groupedByWpid = computed(() => { 
  const groups = list.value.reduce((acc, item) => {
    // 查找当前 wpid 的分组
    let group = acc.get(item.wpid);
    if (!group) {
      // 如果没有找到该分组，则初始化
      group = {
        wpid: item.wpid,
        items: [],
        users: [],
        state: item.state,  // 每个 wpid 只有一个唯一的 state
      };
      acc.set(item.wpid, group);
    }

    // 去重：线缆去重
    if (!group.items.some(existingItem => existingItem.dianlanid === item.dianlanid)) {
      group.items.push(item);
    }
    
    // 去重：用户去重
    if (!group.users.includes(item.user)) {
      group.users.push(item.user);
    }

    return acc;
  }, new Map());

  // 将 Map 转换为数组并返回
  return Array.from(groups.values());
});


const groupedByWpid_bak = computed(() => {
  // 按 wpid 分组，并提取唯一用户
  const groups = list.value.reduce((acc, item) => {
    const group = acc.find((g) => g.wpid === item.wpid);
    if (group) {
      group.items.push(item);
      if (!group.users.includes(item.user)) {
        group.users.push(item.user);
      }
    } else {
      acc.push({ wpid: item.wpid, items: [item], users: [item.user] });
    }
    return acc;
  }, []);
  return groups;
});


const page = ref(0);
const finished = ref(false);
const loading = ref(false);
const refreshing = ref(false);

const confirm_wp = async (id) => {
  console.log('确认：', id);
  showConfirmDialog({
    title: '确认/取消派工',
    message: '是否修改派工单确认状态？',
  })
   .then(async () => {
      // 用户确认删除
      const url = '/api/confirm_paip_wp';
      const data = {
        userCode: userStore.userInfo.userCode,
        id: id,
      };
      try {
        const response = await http.post(url, data);
        if (response.data && response.code === 0) {
          // 删除成功
          showNotify({ message: '操作成功！', type:'success' });
          onRefresh(); // 重新加载数据
          get_wp_todo_cnt();
        } else {
          // 操作失败的具体提示信息
          const errorMessage =
            response.data?.message || '未知错误，删除操作失败！';
          showNotify({ message: `无法确认：${errorMessage}`, type: 'warning' });
        }
      } catch (error) {
        console.error('确认失败:', error);
        // 网络错误或服务器异常提示
        const errorMessage = error.response?.data?.message || '服务器错误';
        showNotify({ message: `无法确认：${errorMessage}`, type: 'error' });
      }
    })
    .catch(() => {
      // 用户取消了删除操作
      showNotify({ message: '已取消确认操作', type: 'info' });
    })
};

const del_wp = async (id) => {
  console.log('删除：', id);
  showConfirmDialog({
    title: '确认删除',
    message: '是否确认删除该派工单？',
  })
    .then(async () => {
      // 用户确认删除
      const url = '/api/del_paip_wp';
      const data = {
        userCode: userStore.userInfo.userCode,
        id: id,
      };
      try {
        const response = await http.post(url, data);

        if (response.data && response.code === 0) {
          // 删除成功
          showNotify({ message: '删除成功！', type: 'success' });
          onRefresh(); // 重新加载数据
        } else {
          // 操作失败的具体提示信息
          const errorMessage =
            response.data?.message || '未知错误，删除操作失败！';
          showNotify({ message: `无法删除：${errorMessage}`, type: 'warning' });
        }
      } catch (error) {
        console.error('删除失败:', error);

        // 网络错误或服务器异常提示
        const errorMessage = error.response?.data?.message || '服务器错误';
        showNotify({ message: `删除失败：${errorMessage}`, type: 'error' });
      }
    })
    .catch(() => {
      // 用户取消了删除操作
      showNotify({ message: '已取消删除操作', type: 'info' });
    });
};

const get_wp_todo_cnt = async () => {
  const res = await http.post('/api/get_paip_wp_todo_cnt', { userCode: userStore.userInfo.userCode });
  console.log('代办数量： ',res.data)
  daibanStore.daiban = res.data
}



// const onRefresh = () => {
//   finished.value = false;
//   page.value = 0;
//   list.value = [];
//   loading.value = true;
//   onLoad();
// };
// 下面是ds给的
const onRefresh = async () => {
  refreshing.value = true;
  page.value = 0;
  list.value = [];
  await onLoad();
  refreshing.value = false;
};

// const fetchData = async () => {
//   const url = '/api/get_paip_wp_list';
//   const data = {
//     userCode: userStore.userInfo.userCode,
//     page: page.value * 10,
//   };

//   try {
//     const response = await http.post(url, data);
//     return { data: response.data, totalCount: response.totalCount };
//   } catch (error) {
//     console.error('请求失败:', error);
//     throw error;
//   }
// };

// const onLoad = async () => {
//   page.value++;
//   if (refreshing.value) {
//     page.value = 0;
//     list.value = [];
//     refreshing.value = false;
//   }

//   const responseData = await fetchData();
//   if (!responseData) {
//     loading.value = false;
//     return;
//   }

//   // Process wpdate for new data
//   const formattedData = responseData.data.map((item) => {
//     const date = new Date(item.wpdate);
//     const datePart = date.toISOString().split('T')[0];
//     const timePart = date.toISOString().split('T')[1].slice(0, 5);
//     return {
//       ...item,
//       formattedWpdate: `${datePart} ${timePart}`,
//     };
//   });

//   list.value.push(...formattedData);
//   loading.value = false;

//   if (list.value.length >= responseData.totalCount) {
//     finished.value = true;
//   }
// };
// 2025-02-27 
const onLoad = async () => {
  if (refreshing.value) {
    page.value = 0;
    list.value = [];
  }

  const url = '/api/get_paip_wp_list';
  const data = {
    userCode: userStore.userInfo.userCode,
    page: page.value * 10,
    qdate: date.value
  };

  try {
    const response = await http.post(url, data);
    const formattedData = response.data.map((item) => {
      const date = new Date(item.wpdate);
      const datePart = date.toISOString().split('T')[0];
      const timePart = date.toISOString().split('T')[1].slice(0, 5);
      return {
        ...item,
        formattedWpdate: `${datePart} ${timePart}`,
      };
    });

    list.value.push(...formattedData);
    console.log('list.length',list.value,list.value.length,response.totalCount)

    if (list.value.length >= response.totalCount) {
      console.log("finished 为 true 了")
      finished.value = true;
    }
  } catch (error) {
    console.error('请求失败:', error);
    
  }finally {
    loading.value = false;
  }

  page.value++;
};

onMounted(() => {
  // load();
  // 2025-02-27  修改load->
  //onLoad();
  get_wp_todo_cnt();
});
</script>

<style scoped>
.wpid-group {
  background-color: #f8f8f8;
  margin-bottom: 0.2rem;
  border-radius: 10px;
  padding: 0.1rem;
}
.wpid-card {
  margin-bottom: 5px;
  border-radius: 8px;
}
.wpid-group-header {
  font-size: 0.8rem;
  color: #333;
  margin-bottom: 5px;
}
.button-container {
  display: flex;
  align-items: flex-start; /* 让子元素顶部对齐，避免高度拉伸 */
  justify-content: space-between; /* 左右两侧分开 */
}

.user-tags {
  display: flex;
  margin-left: 0.4rem;
  flex-wrap: wrap; /* 允许 tags 换行 */
  gap: 0.1rem; /* 设置 tags 之间的间距 */
  align-items: flex-start; /* 让 tags 顶部对齐 */
}

.button-group {
  display: flex;
  align-items: center; /* 让按钮垂直居中 */
  flex-shrink: 0; /* 防止按钮被压缩 */
}

.custom-tag {
  font-size: 0.2rem; /* 调整 tag 的字体大小 */

}


</style>
