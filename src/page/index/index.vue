<template>
   

</template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { showToast } from 'vant'
  import dianlanImage from '@/assets/xianlan.jpg';
  import http from '@/api/request';
  import { showConfirmDialog  } from 'vant';
  import { useUserStore } from '@/store/userStore';
  const userStore = useUserStore();




  

  onMounted( () => {
    
    console.log("首页加载啦; ",userStore.userInfo);
 
  })
  

  </script>
  
  <style scoped>

  </style>
  