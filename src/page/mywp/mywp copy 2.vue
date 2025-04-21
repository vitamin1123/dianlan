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
        <!-- 每个接线员的卡片 -->
        <div v-for="(group, index) in groupedByFinUser" :key="index" class="user-card">
          <div class="user-header">
            <span class="user-name">{{ group.fin_user_name }}</span>
            <span class="cable-count">{{ group.items.length }}条电缆</span>
          </div>
          
          <!-- 电缆列表 -->
          <div v-for="(item, idx) in group.items" :key="idx" class="cable-item">
            <div class="cable-info">
              <span class="cable-title">{{ item.daihao }}</span>
              <span class="cable-desc">{{ item.model }} {{ item.specification }}</span>
              <span class="cable-facilities">{{ item.facilities_name }}</span>
            </div>
            <div class="cable-tags">
              <van-tag v-if="item.facilities" plain type="primary" size="small">{{ item.facilities }}</van-tag>
              <van-tag v-if="item.last_fangxian_loca_name" color="#b27f3d" size="small">{{ item.last_fangxian_loca_name }}</van-tag>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="action-buttons">
            <van-button 
              type="danger" 
              size="small" 
              @click="handleReject(group.fin_user)"
              style="margin-right: 8px;"
            >
              驳回
            </van-button>
            <van-button 
              type="success" 
              size="small" 
              @click="handleConfirm(group.fin_user)"
            >
              确认
            </van-button>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import http from '@/api/request';
import { showNotify, showConfirmDialog } from 'vant';
import { useUserStore } from '@/store/userStore';
import { useDaibanStore } from '@/store/daibanStore';

const userStore = useUserStore();
const daibanStore = useDaibanStore();
const list = ref([]);
const todayDate = new Date().toLocaleDateString('en-CA').replace(/-/g, '/'); 
const date = ref(todayDate);
const show = ref(false);
const maxDate = ref(new Date());
const minDate = ref(new Date());
const activeNames = ref([]);

minDate.value.setDate(maxDate.value.getDate() - 30);

const formatDate = (date) => {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

const onClickLeft = () => history.back();

const onConfirm = async(value) => {
  show.value = false;
  date.value = formatDate(value);
  list.value = [];
  page.value = 0;
  await onLoad();
};

// 按照fin_user分组
const groupedByFinUser = computed(() => {
  const groups = {};
  
  list.value.forEach(item => {
    if (!item.fin_user) return; // 跳过没有fin_user的
    
    if (!groups[item.fin_user]) {
      groups[item.fin_user] = {
        fin_user: item.fin_user,
        fin_user_name: item.fin_user_name,
        items: []
      };
    }
    groups[item.fin_user].items.push(item);
  });
  
  return Object.values(groups);
});

// 驳回操作
const handleReject = (fin_user) => {
  showConfirmDialog({
    title: '确认驳回',
    message: `确定要驳回${fin_user}的所有工单吗？`,
  }).then(() => {
    // 这里调用驳回API
    console.log('驳回接线员:', fin_user);
    showNotify({ type: 'success', message: '已全部驳回' });
  }).catch(() => {
    showNotify({ type: 'info', message: '已取消' });
  });
};

// 确认操作
const handleConfirm = (fin_user) => {
  showConfirmDialog({
    title: '确认工单',
    message: `确定要确认${fin_user}的所有工单吗？`,
  }).then(() => {
    // 这里调用确认API
    console.log('确认接线员:', fin_user);
    showNotify({ type: 'success', message: '已全部确认' });
  }).catch(() => {
    showNotify({ type: 'info', message: '已取消' });
  });
};

const page = ref(0);
const finished = ref(false);
const loading = ref(false);
const refreshing = ref(false);

const onRefresh = async () => {
  refreshing.value = true;
  page.value = 0;
  list.value = [];
  await onLoad();
  refreshing.value = false;
};

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

    if (list.value.length >= response.totalCount) {
      finished.value = true;
    }
  } catch (error) {
    console.error('请求失败:', error);
  } finally {
    loading.value = false;
  }

  page.value++;
};

onMounted(() => {
  get_wp_todo_cnt();
});

const get_wp_todo_cnt = async () => {
  const res = await http.post('/api/get_paip_wp_todo_cnt', { userCode: userStore.userInfo.userCode });
  daibanStore.daiban = res.data;
};
</script>

<style scoped>
.user-card {
  margin-bottom: 16px;
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.user-name {
  font-weight: bold;
  font-size: 22px;
}

.cable-count {
  color: #666;
  font-size: 16px;
}

.cable-item {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.cable-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
}

.cable-title {
  font-weight: bold;
  font-size: 18px;
}

.cable-desc {
  font-size: 18px;
  color: #666;
  margin: 2px 0;
}

.cable-facilities {
  font-size: 18px;
  color: #888;
}

.cable-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>