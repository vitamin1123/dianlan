<template>
  <div class="analytics-page">
    <!-- 顶部卡片 -->
    <div class="top-cards">
      <van-card class="analytics-card">
        <template #title>
          <div class="card-title">
            <van-icon name="chart-trending-o" size="28" />
            <span>今日放线</span>
          </div>
        </template>
        <template #desc>
          <!-- <div class="card-content">
            <span class="card-value">{{ total_length }}</span>
            <span class="card-unit">米</span>
          </div> -->
          <div class="card-content">
            <span class="card-value">{{ total_geng }}</span>
            <span class="card-unit">根</span>
          </div>
          <!-- <van-progress :percentage="75" stroke-width="10" color="#1989fa" /> -->
        </template>
      </van-card>

      <van-card class="analytics-card">
        <template #title>
          <div class="card-title">
            <van-icon name="completed" size="28" />
            <span>今日派工完成情况</span>
          </div>
        </template>
        <template #desc>
          <div class="card-content">
            <span class="card-value">{{ total_fin+'/'+total_pai }}</span>
          </div>
          <van-progress :percentage="(total_fin/total_pai*100).toFixed(0)" stroke-width="10" color="#07c160" />
        </template>
      </van-card>
    </div>

    <!-- 下方列表 -->
    <van-list class="analytics-list">
      <van-cell v-for="item in list" :key="item.id" class="analytics-item">
        <template #title>
          <div class="item-title">
            <van-icon :name="item.icon" size="24" />
            <span>{{ item.title }}</span>
          </div>
        </template>
        <template #label>
          <div class="item-stats">
            <div class="stat-item">
              <span class="stat-label">拉线数量</span>
              <span class="stat-value">{{ item.cableLength }} 米</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">派工数量</span>
              <span class="stat-value">{{ item.assignedTasks }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">完工数量</span>
              <span class="stat-value">{{ item.completedTasks }}</span>
            </div>
          </div>
        </template>
      </van-cell>
    </van-list>
  </div>
</template>

<script setup>
import { ref,onMounted } from 'vue';
import http from '@/api/request';
// 模拟数据
const total_length = ref(0);
const total_geng = ref(0);
const total_pai = ref(0);
const total_fin = ref(0);
const list = ref([
  {
    id: 1,
    icon: 'fire-o',
    title: '项目A',
    cableLength: 1200,
    assignedTasks: 15,
    completedTasks: 12,
  },
  {
    id: 2,
    icon: 'fire-o',
    title: '项目B',
    cableLength: 800,
    assignedTasks: 10,
    completedTasks: 8,
  },
  {
    id: 3,
    icon: 'fire-o',
    title: '项目C',
    cableLength: 500,
    assignedTasks: 8,
    completedTasks: 5,
  },
  {
    id: 4,
    icon: 'fire-o',
    title: '项目D',
    cableLength: 2000,
    assignedTasks: 20,
    completedTasks: 18,
  },
]);


onMounted(async () => {
  try {
    const res = await http.post('/api/get_total_fangxian');
    total_length.value = res.data[0].total_length;
    total_geng.value = res.data[0].total_geng;
    const res1 = await http.post('/api/get_total_pai');
    total_fin.value = res1.data[0].total_fin;
    total_pai.value = res1.data[0].total_pai;
    //console.log('Response:', res.data);
  }
  catch (error) {
    console.error('Error:', error); 
  }
  
  
});
</script>

<style scoped>
.analytics-page {
  padding: 16px;
  background-color: #f7f8fa;
}

/* 顶部卡片样式 */
.top-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.analytics-card {
  flex: 1;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  background-color: #fff;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.4rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.card-content {
  margin: 16px 0;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.card-value {
  font-size: 0.4rem;
  font-weight: bold;
  color: #1989fa;
}

.card-unit {
  font-size: 0.4rem;
  color: #666;
}

/* 列表样式 */
.analytics-list {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.analytics-item {
  padding: 16px;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.4rem;
  font-weight: bold;
  color: #333;
}

.item-stats {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.3rem;
  color: #666;
}

.stat-value {
  font-size: 0.4rem;
  font-weight: bold;
  color: #1989fa;
}
</style>