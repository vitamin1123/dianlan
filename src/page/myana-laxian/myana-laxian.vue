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
      <!-- 今日放线卡片 -->
      <van-card class="analytics-card" @click="showFangxianData">
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

      <!-- 今日工单完成情况卡片 -->
      <van-card class="analytics-card" @click="showWorkOrderData">
        <template #title>
          <div class="card-title">
            <van-icon name="completed" size="28" />
            <span>今日工单完成情况</span>
          </div>
        </template>
        <template #desc>
          <div class="card-content">
            <span class="card-value">{{ confirmedPai }}/{{ total_pai }}</span>
            <span class="card-unit">已确认/总派工单数</span>
          </div>
          <div class="card-content">
            <span class="card-value">{{ total_fin }}</span>
            <span class="card-unit">已确认完成接线数</span>
          </div>
        </template>
      </van-card>
    </div>

    <!-- 树形结构列表 -->
    <van-collapse v-model="activeNames" class="tree-list">
      <!-- 动态渲染树形结构 -->
      <template v-if="currentView === 'fangxian'">
        <!-- 放线数据的树形结构 -->
        <van-collapse-item
          v-for="proj in treeData"
          :key="proj.proj_item"
          :title="`${proj.proj_item} (总计：${proj.count} 根)`"
          :name="proj.proj_item"
          class="tree-node"
        >
          <van-collapse v-model="proj.activeNames">
            <van-collapse-item
              v-for="operator in proj.children"
              :key="operator.last_fangxian_ope"
              :title="`${operator.last_fangxian_ope} (放线数：${operator.count} 根)`"
              :name="operator.last_fangxian_ope"
              class="tree-node-sub"
            >
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
      </template>

      <template v-else-if="currentView === 'workOrder'">
        <!-- 工单数据的树形结构 -->
        <van-collapse-item
          v-for="proj in treeData"
          :key="proj.proj_item"
          :title="`${proj.proj_item} (总计：${proj.count} 根，价格：${proj.total_price.toFixed(2)} 元)`"
          :name="proj.proj_item"
          class="tree-node"
        >
          <van-collapse v-model="proj.activeNames">
            <van-collapse-item
              v-for="worker in proj.children"
              :key="worker.wpowner_name"
              :title="`${worker.wpowner_name} (派工数：${worker.count} 根，价格：${worker.total_price.toFixed(2)} 元)`"
              :name="worker.wpowner_name"
              class="tree-node-sub"
            >
              <van-cell
                v-for="area in worker.children"
                :key="area.name"
                :title="area.name"
                :label="`区域数：${area.count} 根，价格：${area.total_price.toFixed(2)} 元`"
                class="tree-node-item"
              />
            </van-collapse-item>
          </van-collapse>
        </van-collapse-item>
      </template>
    </van-collapse>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/request';

// 数据状态
const total_length = ref(0); // 总放线长度
const total_geng = ref(0); // 总放线根数
const total_pai = ref(0); // 总派工单数量
const confirmedPai = ref(0); // 已确认派工单数量
const total_fin = ref(0); // 总完成数目
const treeData = ref([]); // 树形结构数据
const activeNames = ref([]); // 控制折叠面板的展开状态
const currentView = ref('fangxian'); // 当前视图：fangxian 或 workOrder

// 返回上一页
const onClickLeft = () => history.back();

// 构建放线数据的树形结构
const buildTreeForFangxian = (data) => {
  const tree = [];
  data.forEach((item) => {
    let proj = tree.find((p) => p.proj_item === item.proj_item);
    if (!proj) {
      proj = {
        proj_item: item.proj_item,
        count: 0,
        children: [],
        activeNames: [],
      };
      tree.push(proj);
    }
    proj.count += 1;

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

// 构建工单数据的树形结构
const buildTreeForWorkOrder = (data) => {
  const tree = [];
  data.forEach((item) => {
    let proj = tree.find((p) => p.proj_item === item.proj_item);
    if (!proj) {
      proj = {
        proj_item: item.proj_item,
        count: 0,
        total_price: 0,
        children: [],
        activeNames: [],
      };
      tree.push(proj);
    }
    proj.count += 1;
    proj.total_price += item.price;

    let worker = proj.children.find((w) => w.wpowner_name === item.wpowner_name);
    if (!worker) {
      worker = {
        wpowner_name: item.wpowner_name,
        count: 0,
        total_price: 0,
        children: [],
      };
      proj.children.push(worker);
    }
    worker.count += 1;
    worker.total_price += item.price;

    let area = worker.children.find((a) => a.name === item.name);
    if (!area) {
      area = {
        name: item.name,
        count: 0,
        total_price: 0,
      };
      worker.children.push(area);
    }
    area.count += 1;
    area.total_price += item.price;
  });
  return tree;
};

// 获取放线数据
const fetchFangxianData = async () => {
  try {
    const res = await http.post('/api/get_total_fangxian');
    treeData.value = buildTreeForFangxian(res.data);
    total_geng.value = res.data.length; // 总放线根数
  } catch (error) {
    console.error('Error:', error);
  }
};

// 获取工单汇总数据（总派工单数量和已确认派工单数量）
const fetchWorkOrderSummary = async () => {
  try {
    const res = await http.post('/api/get_total_pai');
    const validData = res.data.filter((item) => item.fin_user !== null); // 过滤掉 fin_user 为 null 的数据
    total_pai.value = res.data.length; // 总派工单数量
    confirmedPai.value = res.data.filter((item) => item.state === 1).length; // 已确认派工单数量
    total_fin.value = validData.length; // 总完成数目（fin_user 不为 null 的数据）
  } catch (error) {
    console.error('Error:', error);
  }
};

// 获取工单详细数据
const fetchWorkOrderData = async () => {
  try {
    const res = await http.post('/api/get_total_pai');
    const validData = res.data.filter((item) => item.fin_user !== null); // 过滤掉 fin_user 为 null 的数据
    treeData.value = buildTreeForWorkOrder(validData);
  } catch (error) {
    console.error('Error:', error);
  }
};

// 切换至放线数据
const showFangxianData = async () => {
  currentView.value = 'fangxian';
  await fetchFangxianData();
};

// 切换至工单数据
const showWorkOrderData = async () => {
  currentView.value = 'workOrder';
  await fetchWorkOrderData();
};

// 初始化加载放线数据和工单汇总数据
onMounted(async () => {
  await showFangxianData();
  await fetchWorkOrderSummary();
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
  font-size: 0.3rem;
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