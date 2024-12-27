<template>
    <van-grid :gutter="10" :column-num="2">
        <van-grid-item icon="chart-trending-o" text="项目统计" to="/myana-proj"/>
        <van-grid-item icon="bar-chart-o" text="放线统计" to="/myana-laxian"/>
        <van-grid-item icon="bar-chart-o" text="接线统计" to="/myana-fangxian"/>
        <van-grid-item icon="user-o" text="人员统计" to="/myana-peo" />
    </van-grid>
</template>
  
  <script setup>
  import { onMounted, ref } from 'vue';


  
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
  