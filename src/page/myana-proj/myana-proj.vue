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
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    toolbox: {
      // feature: {
      //   dataView: { show: true, readOnly: false },
      //   magicType: { show: true, type: ['line', 'bar'] },
      //   restore: { show: true },
      //   saveAsImage: { show: true }
      // }
    },
    legend: {
      data: ['Evaporation', 'Precipitation', 'Temperature']
    },
    xAxis: [
      {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        axisPointer: {
          type: 'shadow'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Precipitation',
        min: 0,
        max: 250,
        interval: 50,
        axisLabel: {
          formatter: '{value} ml'
        }
      },
      {
        type: 'value',
        name: 'Temperature',
        min: 0,
        max: 25,
        interval: 5,
        axisLabel: {
          formatter: '{value} °C'
        }
      }
    ],
    series: [
      {
        name: 'Evaporation',
        type: 'bar',
        tooltip: {
          valueFormatter: function (value) {
            return value + ' ml';
          }
        },
        data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6]
      },
      {
        name: 'Precipitation',
        type: 'bar',
        tooltip: {
          valueFormatter: function (value) {
            return value + ' ml';
          }
        },
        data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6]
      },
      {
        name: 'Temperature',
        type: 'line',
        yAxisIndex: 1,
        tooltip: {
          valueFormatter: function (value) {
            return value + ' °C';
          }
        },
        data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3]
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
