<template>
  <van-nav-bar
    title="统计"
    left-text="返回"
    left-arrow
    @click-left="onClickLeft"
  />
  <div class="analytics-page">
    <!-- 顶部卡片 -->
    <div class="top-cards">
      <van-card class="analytics-card" @click="fetchFangxianData">
        <template #title>
          <div class="card-title">
            <van-icon name="chart-trending-o" size="28" />
            <span>今日放线</span>
          </div>
        </template>
        <template #desc>
          <div class="card-content">
            <span class="card-value">{{ total_geng }}</span>
            <span class="card-unit">根</span>
          </div>
        </template>
      </van-card>
    </div>

    <!-- 树形结构列表 -->
    <van-collapse v-model="activeNames" class="tree-list">
      <!-- 第一层：项目 -->
      <van-collapse-item
        v-for="proj in treeData"
        :key="proj.proj_item"
        :title="`${proj.proj_item} (总计：${proj.count} 根)`"
        :name="proj.proj_item"
        class="tree-node"
      >
        <!-- 第二层：操作员 -->
        <van-collapse
          v-model="proj.activeNames"
          v-if="proj.children.length > 0"
        >
          <van-collapse-item
            v-for="operator in proj.children"
            :key="operator.last_fangxian_ope"
            :title="`${operator.last_fangxian_ope} (放线数：${operator.count} 根)`"
            :name="operator.last_fangxian_ope"
            class="tree-node-sub"
          >
            <!-- 第三层：区域 -->
            <van-cell
              v-for="area in operator.children"
              :key="area.name"
              :title="area.name"
              :label="`区域数：${area.count} 根`"
              class="tree-node-item"
            />
          </van-collapse-item>
        </van-collapse>
      </van-collapse-item>
    </van-collapse>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/request';

const total_length = ref(0);
const total_geng = ref(0);
const total_pai = ref(0);
const total_fin = ref(0);
const treeData = ref([]);
const activeNames = ref([]); // 控制第一层折叠面板的展开状态

const onClickLeft = () => history.back();

// 将数据转换为树形结构
const buildTree = (data) => {
  const tree = [];

  // 按 proj_item 分组
  data.forEach((item) => {
    let proj = tree.find((p) => p.proj_item === item.proj_item);
    if (!proj) {
      proj = {
        proj_item: item.proj_item,
        count: 0,
        children: [],
        activeNames: [], // 控制第二层折叠面板的展开状态
      };
      tree.push(proj);
    }
    proj.count += 1;

    // 按 last_fangxian_ope 分组
    let operator = proj.children.find((o) => o.last_fangxian_ope === item.last_fangxian_ope);
    if (!operator) {
      operator = {
        last_fangxian_ope: item.last_fangxian_ope,
        count: 0,
        children: [],
      };
      proj.children.push(operator);
    }
    operator.count += 1;

    // 按 name 分组
    let area = operator.children.find((a) => a.name === item.name);
    if (!area) {
      area = {
        name: item.name,
        count: 0,
      };
      operator.children.push(area);
    }
    area.count += 1;
  });

  return tree;
};

const fetchFangxianData = async () => {
  try {
    const res = await http.post('/api/get_total_fangxian');
    treeData.value = buildTree(res.data);
    total_geng.value = res.data.length;
  } catch (error) {
    console.error('Error:', error);
  }
};

onMounted(async () => {
  try {
    // const res = await http.post('/api/get_total_fangxian');
    // total_length.value = res.data[0].total_length;
    // total_geng.value = res.data[0].total_geng;

    // const res1 = await http.post('/api/get_total_pai');
    // total_fin.value = res1.data[0].total_fin;
    // total_pai.value = res1.data[0].total_pai;

    // 初次加载时获取放线数据
    await fetchFangxianData();
  } catch (error) {
    console.error('Error:', error);
  }
});
</script>

<style scoped>
.analytics-page {
  padding: 16px;
  background-color: #f7f8fa;
}

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

.tree-list {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tree-node {
  margin-bottom: 8px;
}

.tree-node-sub {
  margin-left: 16px;
}

.tree-node-item {
  margin-left: 32px;
  font-size: 0.3rem;
  color: #666;
}
</style>