<template>
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
              <van-tag v-if="item.fin_user_name"  type="warning" style="margin-right: 0.1rem;">{{ item.fin_user_name }}</van-tag>
              
              <van-tag>{{ item.formattedWpdate }}</van-tag>
            </template>
          </van-card>
          <div class="button-container">
            <div class="user-tags">
              <van-tag
                v-for="(user, userIndex) in group.users"
                :key="userIndex"
                plain
                color="#7232dd"
                style="margin-right: 0.1rem;"
              >
                {{ user }}
            </van-tag>
          </div>
          
            <!-- <van-button type="primary" size="small" :disabled="group.state==1"  @click="del_wp(group.wpid)" style="margin-right: 0.1rem;">删除</van-button> -->
            <van-button type="success" size="small" :plain="group.state==1" @click="confirm_wp(group.wpid)">{{ group.state==1?'反确认':'确认' }}</van-button>
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
// const groupedByWpid = computed(() => { 
//   const groups = list.value.reduce((acc, item) => {
//     const group = acc.find((g) => g.wpid === item.wpid);
//     if (group) {
//       // 将线缆去重
//       if (!group.items.some(existingItem => existingItem.dianlanid === item.dianlanid)) {
//         group.items.push(item);
//       }
//       // 将用户去重
//       if (!group.users.includes(item.user)) {
//         group.users.push(item.user);
//       }
//       if (!group.states.includes(item.state)) {
//         group.states.push(item.state);
//       }
//     } else {
//       acc.push({
//         wpid: item.wpid,
//         items: [item], // 初始化线缆列表
//         users: [item.user], // 初始化用户列表
//         states: [item.state], // 初始化状态列表
//       });
//     }
//     return acc;
//   }, []);
//   return groups;
// });

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
    title: '确认派工',
    message: '是否确认派工？',
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
          showNotify({ message: '确认成功！', type:'success' });
          load(); // 重新加载数据
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
          load(); // 重新加载数据
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



const onRefresh = () => {
  finished.value = false;
  page.value = 0;
  list.value = [];
  loading.value = true;
  onLoad();
};

const fetchData = async () => {
  const url = '/api/get_paip_wp_list';
  const data = {
    userCode: userStore.userInfo.userCode,
    page: page.value * 10,
  };

  try {
    const response = await http.post(url, data);
    return { data: response.data, totalCount: response.totalCount };
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
};

const onLoad = async () => {
  page.value++;
  if (refreshing.value) {
    page.value = 0;
    list.value = [];
    refreshing.value = false;
  }

  const responseData = await fetchData();
  if (!responseData) {
    loading.value = false;
    return;
  }

  // Process wpdate for new data
  const formattedData = responseData.data.map((item) => {
    const date = new Date(item.wpdate);
    const datePart = date.toISOString().split('T')[0];
    const timePart = date.toISOString().split('T')[1].slice(0, 5);
    return {
      ...item,
      formattedWpdate: `${datePart} ${timePart}`,
    };
  });

  list.value.push(...formattedData);
  loading.value = false;

  if (list.value.length >= responseData.totalCount) {
    finished.value = true;
  }
};


const load = async () => {
  const res = await http.post('/api/get_paip_wp_list', {
    userCode: userStore.userInfo.userCode,
    page: page.value,
  });
  list.value = res.data.map((item) => {
    const date = new Date(item.wpdate);
    const datePart = date.toISOString().split('T')[0];
    const timePart = date.toISOString().split('T')[1].slice(0, 5);
    return {
      ...item,
      formattedWpdate: `${datePart} ${timePart}`,
    };
  });
};

onMounted(() => {
  load();
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
  justify-content: flex-end; /* 将按钮靠右 */
  margin-right: 0.11rem; /* 根据需要调整与上方内容的间距 */
}

.user-tags {
  display: flex;
  flex-wrap: wrap; /* 如果用户标签过多，可以换行 */
}
</style>
