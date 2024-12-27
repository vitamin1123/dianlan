<template>
    <van-dropdown-menu>
        <van-dropdown-item v-model="value1" :options="option1" />
        <!-- <van-dropdown-item v-model="value2" :options="option2" /> -->
    </van-dropdown-menu>
    <div class="echarts-container">
      <!-- 动态生成多个饼图 -->
      <div v-if="value1 === 0"
        v-for="(chart, index) in charts" 
        :key="index" 
        class="echarts-box" 
        :id="'chart-' + index" 
        :style="{ width: '100%', height: '400px' }">
      </div>
    </div>

    <div >

    </div>
</template>
  
  <script setup>
  import { onMounted, ref } from 'vue';
  import * as echarts from "echarts";

  const value1 = ref(0);
  const value2 = ref('a');
  const option1 = [
      { text: '项目统计', value: 0 },
      { text: '接线统计', value: 1 },
      { text: '拉线统计', value: 2 },
      { text: '人员统计', value: 3 },
  ];
//   const option2 = [
//       { text: '默认排序', value: 'a' },
//       { text: '好评排序', value: 'b' },
//       { text: '销量排序', value: 'c' }, 
//   ];
  
  // 定义多个图表数据
  const charts = [
    {
      title: 'Chart 1',
      data: [
        { value: 1048, name: 'Search Engine' },
        { value: 735, name: 'Direct' },
        { value: 580, name: 'Email' },
        { value: 484, name: 'Union Ads' },
        { value: 300, name: 'Video Ads' },
      ],
    },
    {
      title: 'Chart 2',
      data: [
        { value: 300, name: 'Facebook' },
        { value: 450, name: 'Instagram' },
        { value: 700, name: 'Twitter' },
        { value: 200, name: 'LinkedIn' },
        { value: 500, name: 'TikTok' },
      ],
    },
  ];
  
  onMounted(() => {
    // 遍历生成每个图表
    charts.forEach((chart, index) => {
      const chartDom = document.getElementById(`chart-${index}`);
      const myChart = echarts.init(chartDom);
  
      const option = {
        tooltip: {
          trigger: 'item',
        },
        legend: {
          top: '5%',
          left: 'center',
        },
        series: [
          {
            name: chart.title,
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: false,
              position: 'center',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 40,
                fontWeight: 'bold',
              },
            },
            labelLine: {
              show: false,
            },
            data: chart.data,
          },
        ],
      };
  
      myChart.setOption(option);
  
      // 监听窗口大小变化，调整每个图表大小
      window.addEventListener('resize', () => {
        myChart.resize();
      });
    });
  });
  </script>
  
  <style scoped>
  .echarts-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .echarts-box {
    flex: 1 1 calc(50% - 16px); /* 每个图表占一半宽度，留出间距 */
    min-width: 300px; /* 最小宽度 */
  }
  </style>
  