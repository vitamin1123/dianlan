<template>
  <!-- <van-dropdown-menu>
    <van-dropdown-item v-model="value1" :options="option1" />
  </van-dropdown-menu> -->


    <div class="echarts-container">
    <!-- 第一个图：折线图 + 柱状图 -->
    <div id="lineBarChart" style="width: 100%; height: 400px;"></div>
    <div id="lineBarChart1" style="width: 100%; height: 400px;"></div>
    
  </div>

</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import http  from '@/api/request';
import * as echarts from "echarts";

const value1 = ref(0); // 控制选择的值，决定显示哪个图表
const option1 = [
  { text: "项目统计", value: 0 },
  { text: "接线统计", value: 1 },
  { text: "拉线统计", value: 2 },
  { text: "人员统计", value: 3 },
];

// 渲染第一个图表（折线图 + 柱状图）的函数
const renderLineBarChart = async() => {
  const lineBarChart = document.getElementById('lineBarChart');
  const myLineBarChart = echarts.init(lineBarChart);
  let yAxisData = [];
  let seriesData1 = [];
  let seriesData2 = [];

  try {
    // 从后端获取数据
    const res = await http.post('/api/ana_laxian', {});

    // 假设返回的数据格式为数组，处理数据填充 yAxis 和 series
    if (res && res.data) {
      yAxisData = res.data.map(item => item.username);  // 假设数据包含 name 字段
      seriesData1 = res.data.map(item => item.legnth);  // 假设数据包含 value1 字段
      seriesData2 = res.data.map(item => item.cnt);  // 假设数据包含 value2 字段
    }
  } catch (error) {
    console.error('数据加载失败:', error);
    // 错误时使用默认数据
    yAxisData = ['数据加载失败'];
    seriesData1 = [0];
    seriesData2 = [0];
  }
  const lineBarOption = {
    // title: {
    //   text: 'World Population'
    // },
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
    data: yAxisData  
  },
  series: [
    {
      name: '长度',
      type: 'bar',
      data: seriesData1  
    },
    {
      name: '根数',
      type: 'bar',
      data: seriesData2  
    }
  ]
  };

  myLineBarChart.setOption(lineBarOption);
};

//
const renderLineBarChart1 = async() => {
  let xAxisData = [];
  let seriesData1 = [];
  let seriesData2 = [];

  var chartDom = document.getElementById('lineBarChart1');
  var myChart = echarts.init(chartDom);
  var option;

  try {
    // 从后端获取数据
    const res = await http.post('/api/ana_laxian1', {});

    // 假设返回的数据格式为数组，处理数据填充 yAxis 和 series
    if (res && res.data) {
      xAxisData = res.data.map(item => item.facilities_loca);  // 假设数据包含 name 字段
      seriesData1 = res.data.map(item => item.total_count);  // 假设数据包含 value1 字段
      seriesData2 = res.data.map(item => item.count_state_1);  // 假设数据包含 value2 字段
    }
  } catch (error) {
    console.error('数据加载失败:', error);
    // 错误时使用默认数据
    yAxisData = ['数据加载失败'];
    seriesData1 = [0];
    seriesData2 = [0];
  }
  const lineBarOption = {
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        rotate: 45, // 旋转45度
        formatter: (value) => value.length > 5 ? value.slice(0, 5) + '...' : value // 可选：截断长文字
    }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line'
      },
      {
        data: [120, 892, 700, 700, 70, 600, 60],
        type: 'bar'
      }
    ]
  };

  myChart.setOption(lineBarOption);
};



// 在 onMounted 中调用渲染函数
onMounted(() => {
  renderLineBarChart();
  renderLineBarChart1();
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
