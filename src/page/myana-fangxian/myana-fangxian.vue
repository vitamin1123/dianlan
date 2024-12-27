<template>
  <van-dropdown-menu>
    <van-dropdown-item v-model="value1" :options="option1" />
  </van-dropdown-menu>


    <div class="echarts-container">
    <!-- 第一个图：折线图 + 柱状图 -->
    <div id="lineBarChart" style="width: 100%; height: 400px;"></div>

    
  </div>

</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import * as echarts from "echarts";

const value1 = ref(0); // 控制选择的值，决定显示哪个图表
const option1 = [
  { text: "项目统计", value: 0 },
  { text: "接线统计", value: 1 },
  { text: "拉线统计", value: 2 },
  { text: "人员统计", value: 3 },
];

// 渲染第一个图表（折线图 + 柱状图）的函数
const renderLineBarChart = () => {
  const lineBarChart = document.getElementById('lineBarChart');
  const myLineBarChart = echarts.init(lineBarChart);
  
  const lineBarOption = {
    title: {
    text: 'World Population'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {},
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    boundaryGap: [0, 0.01]
  },
  yAxis: {
    type: 'category',
    data: ['Brazil', 'Indonesia', 'USA', 'India', 'China', 'World']
  },
  series: [
    {
      name: '2011',
      type: 'bar',
      data: [18203, 23489, 29034, 104970, 131744, 630230]
    },
    {
      name: '2012',
      type: 'bar',
      data: [19325, 23438, 31000, 121594, 134141, 681807]
    }
  ]
  };

  myLineBarChart.setOption(lineBarOption);
};



// 在 onMounted 中调用渲染函数
onMounted(() => {
  renderLineBarChart();
  // renderGaugeChart();
});
</script>

<style scoped>
.echarts-container {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 图表之间的间距 */
}

.echarts-box {
  flex: 1 1 calc(50% - 16px); /* 每个图表占一半宽度，留出间距 */
  min-width: 300px; /* 最小宽度 */
}
</style>
