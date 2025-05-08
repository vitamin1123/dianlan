<template>
  <van-nav-bar
    title="当日产值"
    left-text="返回"
    left-arrow
    @click-left="onClickLeft"
  />
  <div class="container">
    <div class="header">
      <van-cell title="工单日期" :value="date" @click="show = true" style="width:60%" />
      <div class="price-display">
        <div class="price-line">
          <span>已确认：</span>
          <span>￥{{ totalConfirmedPrice.toFixed(2) }}</span>
        </div>
        <div class="price-line">
          <span>总产值：</span>
          <span>￥{{ totalCheckedPrice.toFixed(2) }}</span>
        </div>
      </div>
      <van-calendar v-model:show="show" :min-date="minDate" :max-date="maxDate" @confirm="onConfirm" />
    </div>

    <van-tabs v-model:active="activeTab">
      <van-tab title="设备">
        <div class="collapse-container">
          <van-collapse v-model="activeCollapse" accordion>
            <!-- 项目分组 -->
            <van-collapse-item 
              v-for="proj in projItems" 
              :key="proj.key" 
              :title="getProjTitle(proj.key)" 
              :name="'proj-'+proj.key"
              class="no-indent"
            >
              <!-- 放线位置分组 -->
              <van-collapse v-model="activeLocationCollapse" accordion>
                <van-collapse-item 
                  v-for="location in getLocationsByProj(proj.key)" 
                  :key="location.key" 
                  
                  :name="'location-'+location.key"
                  class="no-indent"
                  
                >
                <template #title>
                    <span v-html="getLocationTitle(proj.key, location.key)"></span>
                </template>
                  <!-- 设备位置分组 -->
                  <van-collapse v-model="activeFacilityLocaCollapse" accordion>
                    <van-collapse-item 
                      v-for="facilityLoca in getFacilityLocasByLocation(proj.key, location.key)" 
                      :key="facilityLoca.key" 
                      :name="'facilityLoca-'+facilityLoca.key"
                      class="no-indent"
                    >
                    <template #title>
                      <span v-html="getFacilityLocaTitle(proj.key, location.key, facilityLoca.key)"></span>
                    </template>
                      <!-- TreeSelect 组件 -->
                      <van-tree-select
                        v-model:main-active-index="activeIndex"
                        v-model:selected="selectedIds"
                        :items="getTreeItems(proj.key, location.key, facilityLoca.key)"
                        height="calc(100vh - 500px)"
                        @click-nav="onNavClick"
                        @click-item="onItemClick"
                      >
                      
                        <template #content>
                          <div v-if="activeFacility">
                            <div style="padding: 8px 12px; border-bottom: 1px solid #f5f5f5;">
                            <van-button 
                              size="mini" 
                              type="primary" 
                              @click="toggleSelectAll(proj.key, location.key, facilityLoca.key)"
                              :disabled = "date != todayDate"
                            >
                              {{ isAllSelected(proj.key, location.key, facilityLoca.key) ? '取消全选' : '全选' }}
                            </van-button>
                          </div>
                            <van-checkbox-group 
                            v-model="checked" 
                            ref="checkboxGroup" 
                            shape="square" 
                            @change="checkChange"
                            :disabled="isBatchOperating"
                            >
                              <van-checkbox 
                                v-for="item in getActiveFacilityChildren(proj.key, location.key, facilityLoca.key)"
                                :key="item.dianlanid"
                                :name="item.id+'Φ'+item.wpid" 
                                :disabled="(item.fin_user != null && item.fin_user != userStore.userInfo.userCode)|| date != todayDate || item.state == 1"
                                class="checkbox"
                              >
                                <van-card
                                  :num="item.num"
                                  :desc="item.model+'  '+ item.specification"
                                  :title="item.daihao"
                                  style="--van-card-font-size: 0.4rem;--van-card-padding: 0.1rem 0.1rem"
                                >
                                  <template #tags>
                                    <van-tag v-if="item.facilities" type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
                                    <!-- <van-tag v-if="item.facilities_name && item.facilities_name.trim() !== ''" color="#ffe1e1" text-color="#ad0000" style="margin-right: 0.1rem;">{{ item.facilities_name }}</van-tag> -->
                                    <van-tag v-if="item.fin_user_name" color="#008866">{{ "接线:"+item.fin_user_name }}</van-tag>
                                  </template>
                                </van-card>
                              </van-checkbox>
                            </van-checkbox-group>
                          </div>
                          <div v-else class="empty-tip">
                            请选择设备
                          </div>
                        </template>
                      </van-tree-select>
                    </van-collapse-item>
                  </van-collapse>
                </van-collapse-item>
              </van-collapse>
            </van-collapse-item>
          </van-collapse>
        </div>
      </van-tab>
      <van-tab title="电缆">
        <van-checkbox-group v-model="checked" ref="checkboxGroup" shape="square" @change="checkChange">
          <van-checkbox 
            v-for ="item in list"
            :key = "item.dianlanid"
            :name="item.id+'Φ'+item.wpid" 
            :disabled="(item.fin_user != null && item.fin_user != userStore.userInfo.userCode)|| date != todayDate || item.state == 1"
            class="checkbox"
          >
            <van-card
              :num="item.num"
              :desc="item.model+'  '+ item.specification"
              :title="item.daihao"
              style="--van-card-font-size: 0.4rem;--van-card-padding: 0.1rem 0.1rem"
            >
              <template #tags>
                
                <van-tag v-if="item.facilities && item.facilities.trim() !== ''" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
                <van-tag v-if="item.facilities_loca && item.facilities_loca.trim() !== ''" color="#ffe1e1" text-color="#ad0000" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
                <van-tag v-if="item.facilities_name && item.facilities_name.trim() !== ''" plain color="#7232dd" style="margin-right: 0.1rem;">{{ item.facilities_name }}</van-tag>
                <van-tag v-if="item.fin_user_name" color="#008866">{{ "接线:"+item.fin_user_name }}</van-tag>
              </template>
            </van-card>
          </van-checkbox>
        </van-checkbox-group>
      </van-tab>
    </van-tabs>

    <!-- 底部操作栏 -->
    <van-submit-bar 
      :price="totalCheckedPrice * 100" 
      button-text="提交确认"
      :loading="isSubmitting"
    >
    
      <template #button>
        <van-action-bar-button 
          type="warning" 
          text="上传照片" 
          @click="showUploadDialog" 
          color="#FFA500"
          style="border-bottom-left-radius: 0.5rem; border-top-left-radius: 0.5rem; "
        />
        <van-action-bar-button 
          type="warning" 
          text="确认" 
          @click="onSubmitLaxian" 
          color="#FF8C00"
          :disabled="!hasTodayUploadRecord || cart.length > 0 && cart.every(item => item.state !== 0)"
          style="border-bottom-right-radius: 0.5rem; border-top-right-radius: 0.5rem;"
        />
      </template>  
      <template #default>
        <div style="display: flex; justify-content: flex-end; align-items: center;">
          <van-action-bar-icon
            icon="cart-o"
            :badge="cart.length"
            text="接线包"
            :class="{ 'scale-animation': isScaling }"
            @click="showCartPopup = true"
          />
        </div>
      </template>
    </van-submit-bar>
  <!-- 照片上传弹窗 -->
  <van-dialog
  v-model:show="showUploadDialogVisible"
  title="上传工作照片"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :style="{ maxHeight: '80vh' }"
>
<div style="padding: 16px; max-height: calc(80vh - 120px); overflow-y: auto;">
    <van-uploader
      v-model="fileList"
      multiple
      :max-count="50"
      :before-read="beforeRead"
      :after-read="afterRead"
      :max-size="5 * 1024 * 1024"
      @oversize="onOversize"
      preview-image
      deletable
      capture="environment"
      accept="image/*"
    >
      <template #upload-text>
        <div v-if="isCompressing" style="padding: 16px 0; text-align: center;">
          <van-loading type="spinner" size="24px" />
          <div>正在压缩图片...</div>
        </div>
        <div v-else style="padding: 16px 0; text-align: center;">
          <div>点击上传工作照片</div>
          <div style="font-size: 12px; color: #969799;">
            (最少2张，最多50张)
          </div>
        </div>
      </template>
    </van-uploader>
    <div v-if="fileList.length > 0" style="margin-top: 12px; text-align: center; color: #969799;">
      已上传 {{ fileList.length }} 张照片
    </div>
    <div style="padding: 16px; display: flex; justify-content: space-between; border-top: 1px solid #eee;">
    <van-button 
      size="large" 
      style="width: 48%;" 
      @click="showUploadDialogVisible = false"
    >
      取消
    </van-button>
    <van-button 
      type="primary" 
      size="large" 
      style="width: 48%;" 
      @click="onUploadDialogConfirm"
      :disabled="fileList.length < 2"
    >
      确认({{ fileList.length }})
    </van-button>
  </div>
  </div>
</van-dialog>

    <!-- 接线包弹窗 -->
    <van-popup
      v-model:show="showCartPopup"
      position="bottom"
      round
      :style="{ height: '80%' }"
    >
      <div class="cart-popup">
        <van-nav-bar
          title="接线包"
          left-text="关闭"
          left-arrow
          @click-left="showCartPopup = false"
        />
        <div class="cart-content">
          <van-checkbox-group v-model="cartChecked">
            <van-cell-group>
              <van-cell 
                v-for="item in cart" 
                :key="item.id+'Φ'+item.wpid"
                clickable
              >
                <template #title>
                  <van-checkbox 
                    :name="item.id+'Φ'+item.wpid" 
                    shape="square"
                    @click.stop
                  >
                    <div class="cart-item">
                      <div class="item-title">{{ item.daihao }}</div>
                      <div class="item-desc">{{ item.model }} {{ item.specification }}</div>
                      <div class="item-info">
                        <van-tag v-if="item.facilities" type="primary" size="small">{{ item.facilities }}</van-tag>
                        <van-tag v-if="item.facilities_name" plain color="#7232dd" size="small">{{ item.facilities_name }}</van-tag>
                        <span class="item-price">
                          <span v-if="item.baseprice !== item.ori_price" class="original-price">
                            ￥{{ item.ori_price?.toFixed(2) || '0.00' }}
                          </span>
                          ￥{{ item.baseprice?.toFixed(2) || '0.00' }}
                        </span>
                      </div>
                    </div>
                  </van-checkbox>
                </template>
              </van-cell>
            </van-cell-group>
          </van-checkbox-group>
        </div>
        <div class="cart-footer">
          <van-button 
            type="danger" 
            block 
            @click="removeSelectedItems"
            :disabled="cartChecked.length === 0"
          >
            移除选中项 ({{ cartChecked.length }})
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted  } from 'vue';
import { useUserStore } from '@/store/userStore';
import { useDaibanStore } from '@/store/daibanStore'
import { showToast, showConfirmDialog } from 'vant';
import { baseURL } from "@/api/my-account";
import http from '@/api/request';
import Compressor from 'compressorjs';
const isCompressing = ref(false);
const userStore = useUserStore();
const daibanStore = useDaibanStore();
const checked = ref([]);
const list = ref([]);
const checkboxGroup = ref(null);
const todayDate = new Date().toLocaleDateString('en-CA').replace(/-/g, '/');
const date = ref(todayDate);
const maxDate = ref(new Date());
const minDate = ref(new Date());
minDate.value.setDate(maxDate.value.getDate() - 30);
const show = ref(false);
const previousCheckedValues = ref([]);
const totalConfirmedPrice = ref(0);
const totalCheckedPrice = ref(0);
const activeTab = ref(0);
const isBatchOperating = ref(false);

// Collapse 相关状态
const activeCollapse = ref('');
const activeLocationCollapse = ref('');
const activeFacilityLocaCollapse = ref('');
const activeIndex = ref(0);
const selectedIds = ref([]);

// ActionBar 相关状态
const isSubmitting = ref(false);
const showCartPopup = ref(false);
const cartChecked = ref([]);
const isScaling = ref(false);
const hasTodayUploadRecord = ref(false); 
// 照片上传相关状态
const showUploadDialogVisible = ref(false);
const fileList = ref([]);
const isUploading = ref(false);

const onClickLeft = () => history.back();

const onUploadDialogConfirm = async () => {
  if (fileList.value.length < 2) {
    showToast('请至少上传2张照片');
    return;
  }

  try {
    isUploading.value = true;
    
    const formData = new FormData();
    
    // 1. 添加新上传的文件
    fileList.value.forEach((file) => {
      if (file.file) {
        formData.append('files', file.file);
      }
    });
    
    // 2. 添加保留的原始图片URL
    const originalFiles = fileList.value
      .filter(file => file.url && !file.file && !file.deleted)
      .map(file => file.url);
    
    if (originalFiles.length > 0) {
      formData.append('originalFiles', JSON.stringify(originalFiles));
    }
    
    // 3. 添加用户信息
    formData.append('userCode', userStore.userInfo.userCode);
    
    const response = await http.post('/api/submit_post_imgs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.success) {
      showToast('上传成功');
      hasTodayUploadRecord.value = true; // 更新状态
      showUploadDialogVisible.value = false;
      // 刷新图片列表
      fileList.value = [];
      await showUploadDialog(); // 重新加载已上传图片
    } else {
      showToast(response.message || '上传失败');
    }
  } catch (error) {
    console.error('上传失败:', error);
    showToast('上传失败');
  } finally {
    isUploading.value = false;
  }
};
// const onUploadDialogConfirm = async () => {
//   if (fileList.value.length < 2) {
//     showToast('请至少上传2张照片');
//     return;
//   }

//   try {
//     isUploading.value = true;
    
//     const formData = new FormData();
//     fileList.value.forEach((file) => {
//       if (file.file) {
//         formData.append('files', file.file);
//       }
//     });
    
//     // 添加关联的工作项信息
//     formData.append('userCode', userStore.userInfo.userCode);
    
    
//     const response = await http.post('/api/submit_post_imgs', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     });

//     if (response.success) {
//       showToast('上传成功');
//       showUploadDialogVisible.value = false;
//       // 可以在这里触发数据刷新或其他操作
//     } else {
//       showToast(response.message || '上传失败');
//     }
//   } catch (error) {
//     console.error('上传失败:', error);
//     showToast('上传失败');
//   } finally {
//     isUploading.value = false;
//   }
// };

// 显示上传对话框
const showUploadDialog = async() => {
  if (checked.value.length === 0) {
    showToast('请先选择要确认的项目');
    return;
  }
  
  // 先清空文件列表
  fileList.value = [];
  
  try {
    // 请求后台获取今天已上传的照片
    const res = await http.post('/api/get_today_uploaded', { 
      userCode: userStore.userInfo.userCode 
    });
    
    if (res.data && res.data.length > 0) {
      const imagePaths = res.data[0].image_paths.split(',');
      
      // 将图片路径转换为 uploader 需要的格式
      fileList.value = imagePaths.map(path => ({
        // url
        url: baseURL+`/public/img/${path.trim()}`, // 假设图片通过 /api/img/ 路径访问
        status: 'done', // 标记为已上传
        message: '已上传' // 可选状态信息
      }));
    }
    
    showUploadDialogVisible.value = true;
  } catch (error) {
    console.error('获取已上传图片失败:', error);
    showToast('获取已上传图片失败');
  }
};

// 上传对话框关闭前检查
const beforeUploadDialogClose = (action) => {
  if (action === 'confirm' && fileList.value.length < 2) {
    showToast('请至少上传2张照片');
    return false;
  }
  return true;
};

// 文件读取前的处理
const beforeRead = (file) => {
  if (!file.type.startsWith('image/')) {
    showToast('请上传图片文件');
    return false;
  }
  return true;
};

// 文件大小超过限制
const onOversize = () => {
  showToast('文件大小不能超过5MB');
};

// 文件读取后的压缩处理
const afterRead = async (fileItem) => {
  // 小文件不压缩（小于500KB）
  if (fileItem.file.size < 500 * 1024) {
    return;
  }

  try {
    // 标记压缩状态
    fileItem.isCompressing = true;
    isCompressing.value = true;
    
    // 使用Compressor.js压缩
    fileItem.file = await new Promise((resolve) => {
      new Compressor(fileItem.file, {
        quality: 0.5,
        maxWidth: 1920,
        maxHeight: 1920,
        success(result) {
          resolve(result);
        },
        error(err) {
          console.warn('压缩失败，使用原文件:', err);
          resolve(fileItem.file); // 失败时返回原文件
        }
      });
    });
  } catch (error) {
    console.error('压缩异常:', error);
  } finally {
    fileItem.isCompressing = false;
    isCompressing.value = false;
  }
};

// 计算接线包内容
const cart = computed(() => {
  // return list.value.filter(item => 
  //   checked.value.includes(item.id + 'Φ' + item.wpid)
  // );
  return list.value.filter(item => 
    checked.value.includes(item.id + 'Φ' + item.wpid) &&
    (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
  );
});

// 监听 cart 变化，触发动画效果
watch(cart, (newVal, oldVal) => {
  if (newVal.length > oldVal.length) {
    isScaling.value = true;
    setTimeout(() => {
      isScaling.value = false;
    }, 500);
  }
});

const isAllSelected = (projKey, locationKey, facilityLocaKey) => {
  const items = getActiveFacilityChildren(projKey, locationKey, facilityLocaKey);
  if (!items.length) return false;
  
  return items.every(item => 
    checked.value.includes(item.id + 'Φ' + item.wpid)
  );
};

// 切换全选状态
const toggleSelectAll = async (projKey, locationKey, facilityLocaKey) => {
  isBatchOperating.value = true;
  
  try {
    const items = getActiveFacilityChildren(projKey, locationKey, facilityLocaKey);
    const allSelected = isAllSelected(projKey, locationKey, facilityLocaKey);
    
    // 临时禁用change监听
    const originalHandler = checkboxGroup.value?.onChange;
    if (checkboxGroup.value) {
      checkboxGroup.value.onChange = () => {};
    }
    console.log('allSelected:',allSelected)
    if (allSelected) {
      // 取消全选
      const itemsToRemove = items
        .filter(item => 
          !(item.fin_user != null && item.fin_user != userStore.userInfo.userCode) && 
          item.dianlanstate == 1 && 
          item.state !== 1
        )
        .map(item => ({
          id: item.id,
          wpid: item.wpid
        }));
      
      const res = await http.post('/api/del_my_work_batch', {
        code: userStore.userInfo.userCode,
        items: itemsToRemove
      });
      console.log('res:',res.success)
      if (res.success) {
        // 直接更新checked数组，不触发响应式更新
        const newChecked = checked.value.filter(
          id => !items.some(item => id === item.id + 'Φ' + item.wpid)
        );
        checked.value = newChecked;
        previousCheckedValues.value = [...newChecked];
        load();
      }
      else {
        showToast('操作失败');
      }
      
      
    } else {
      // 全选 没有加dianlanstate，会更新所有
      const itemsToAdd = items
        .filter(item => 
          item.fin_user != userStore.userInfo.userCode && 
          date.value === todayDate && 
          item.state !== 1
        )
        .map(item => ({
          id: item.id,
          wpid: item.wpid
        }));
      
      const res = await http.post('/api/add_my_work_batch', {
        code: userStore.userInfo.userCode,
        items: itemsToAdd
      });
      
      if (res.success) {
        const newChecked = [...checked.value];
        itemsToAdd.forEach(item => {
          newChecked.push(item.id + 'Φ' + item.wpid);
        });
        checked.value = newChecked;
        previousCheckedValues.value = [...newChecked];
        load(); // 重新加载数据
      } else {
        showToast('操作失败');
      }
    }
    
    updatePrices();
    
  } catch (error) {
    console.error('批量操作失败:', error);
    showToast('操作失败');
  } finally {
    // 恢复change监听
    if (checkboxGroup.value) {
      checkboxGroup.value.onChange = checkChange;
    }
    isBatchOperating.value = false;
  }
};

const updatePrices = () => {
  // totalCheckedPrice.value = list.value
  //   .filter(item => checked.value.includes(item.id + 'Φ' + item.wpid))
  //   .reduce((total, item) => total + (item.baseprice || 0), 0);

  // totalConfirmedPrice.value = list.value
  //   .filter(item => checked.value.includes(item.id + 'Φ' + item.wpid) && item.state === 1)
  //   .reduce((total, item) => total + (item.baseprice || 0), 0);
  totalCheckedPrice.value = list.value
    .filter(item => 
      checked.value.includes(item.id + 'Φ' + item.wpid) &&
      (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
    )
    .reduce((total, item) => total + (item.baseprice || 0), 0);

  totalConfirmedPrice.value = list.value
    .filter(item => 
      checked.value.includes(item.id + 'Φ' + item.wpid) && 
      item.state === 1 &&
      (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
    )
    .reduce((total, item) => total + (item.baseprice || 0), 0);
};
// 移除选中的接线包项目
const removeSelectedItems = () => {
  checked.value = checked.value.filter(item => !cartChecked.value.includes(item));
  cartChecked.value = [];
  showToast('已移除选中项');
};

// 确认提交
const onSubmitLaxian = async () => {
  try {
    isSubmitting.value = true;
    const res = await http.post('/api/confirm_work', { 
      userCode: userStore.userInfo.userCode,
      items: checked.value.map(item => {
        const [id, wpid] = item.split('Φ');
        return { id, wpid };
      })
    });
    
    showToast('提交成功');
    load(); // 重新加载数据
  } catch (error) {
    console.error('提交失败:', error);
    showToast('提交失败');
  } finally {
    isSubmitting.value = false;
  }
};

// 计算项目分组
const projItems = computed(() => {
  const projs = new Set();
  list.value.forEach(item => {
    if (item.proj_item) {
      projs.add(item.proj_item);
    }
  });
  
  return Array.from(projs).map(proj => ({
    title: proj,
    key: proj
  }));
});

// 根据项目获取放线位置
const getLocationsByProj = (projKey) => {
  const locations = new Set();
  
  list.value.forEach(item => {
    if (item.proj_item === projKey && item.last_fangxian_loca_name) {
      locations.add(item.last_fangxian_loca_name);
    }
  });
  
  return Array.from(locations).map(location => ({
    title: location,
    key: location
  }));
};

// 根据项目和放线位置获取设备位置
const getFacilityLocasByLocation = (projKey, locationKey) => {
  const locas = new Set();
  
  list.value.forEach(item => {
    if (item.proj_item === projKey && 
        item.last_fangxian_loca_name === locationKey && 
        item.facilities_loca) {
      locas.add(item.facilities_loca);
    }
  });
  
  return Array.from(locas).map(loca => ({
    title: loca,
    key: loca
  }));
};

// 获取树形数据
const getTreeItems = (projKey, locationKey, facilityLocaKey) => {
  const filteredList = list.value.filter(item => 
    item.proj_item === projKey && 
    item.last_fangxian_loca_name === locationKey && 
    item.facilities_loca === facilityLocaKey
  );
  
  const facilitiesMap = {};
  
  filteredList.forEach(item => {
    if (!facilitiesMap[item.facilities_name]) {
      facilitiesMap[item.facilities_name] = {
        text: item.facilities_name,
        children: []
      };
    }
    facilitiesMap[item.facilities_name].children.push({
      text: `${item.daihao} (${item.model} ${item.specification})`,
      id: item.id + 'Φ' + item.wpid
    });
  });
  
  return Object.values(facilitiesMap).map(facility => {
    // const checkedCount = facility.children.filter(child => 
    //   checked.value.includes(child.id)
    // ).length;
    const checkedCount = facility.children.filter(child => 
      checked.value.includes(child.id) &&
      filteredList.some(item => 
        item.id + 'Φ' + item.wpid === child.id &&
        (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
      )
    ).length;
    
    return {
      ...facility,
      badge: checkedCount > 0 ? checkedCount : undefined
    };
  });
};

// 获取当前激活的设备子项
const getActiveFacilityChildren = (projKey, locationKey, facilityLocaKey) => {
  if (!activeFacility.value) return [];
  
  return list.value.filter(item => 
    item.proj_item === projKey && 
    item.last_fangxian_loca_name === locationKey && 
    item.facilities_loca === facilityLocaKey &&
    item.facilities_name === activeFacility.value.text
  );
};

// 获取项目标题（带选中统计）
const getProjTitle = (projKey) => {
  // const count = list.value.filter(item => 
  //   item.proj_item === projKey && 
  //   checked.value.includes(item.id + 'Φ' + item.wpid)
  // ).length;
  const count = list.value.filter(item => 
    item.proj_item === projKey && 
    checked.value.includes(item.id + 'Φ' + item.wpid) &&
    (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
  ).length;
  
  return `${projKey} (${count})`;
};

// 获取放线位置标题（带选中统计和层级标识）
const getLocationTitle = (projKey, locationKey) => {
  const count = list.value.filter(item => 
    item.proj_item === projKey && 
    item.last_fangxian_loca_name === locationKey && 
    checked.value.includes(item.id + 'Φ' + item.wpid) &&
    (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
  ).length;
  
  return `<span style="display:inline-block;width:1em;">•</span> ${locationKey} (${count})`;
};

// 获取设备位置标题（带选中统计和层级标识）
const getFacilityLocaTitle = (projKey, locationKey, facilityLocaKey) => {
  // const count = list.value.filter(item => 
  //   item.proj_item === projKey && 
  //   item.last_fangxian_loca_name === locationKey && 
  //   item.facilities_loca === facilityLocaKey && 
  //   checked.value.includes(item.id + 'Φ' + item.wpid)
  // ).length;
  const count = list.value.filter(item => 
    item.proj_item === projKey && 
    item.last_fangxian_loca_name === locationKey && 
    item.facilities_loca === facilityLocaKey && 
    checked.value.includes(item.id + 'Φ' + item.wpid) &&
    (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
  ).length;
  
  return `<span style="display:inline-block;width:1em;">•</span><span style="display:inline-block;width:1em;">•</span> ${facilityLocaKey} (${count})`;
};

// 当前选中的设备
const activeFacility = computed(() => {
  if (activeIndex.value >= 0) {
    const projKey = activeCollapse.value.replace('proj-', '');
    const locationKey = activeLocationCollapse.value.replace('location-', '');
    const facilityLocaKey = activeFacilityLocaCollapse.value.replace('facilityLoca-', '');
    
    const treeItems = getTreeItems(projKey, locationKey, facilityLocaKey);
    if (treeItems[activeIndex.value]) {
      return treeItems[activeIndex.value];
    }
  }
  return null;
});

const onNavClick = (index) => {
  activeIndex.value = index;
  selectedIds.value = [];
};

const onItemClick = ({ id }) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};


const checkChange = async(newCheckedValues) => {
  console.log('checkChange:',isBatchOperating.value)
  if (isBatchOperating.value) return;
  
  
  const added = newCheckedValues.filter(value => !previousCheckedValues.value.includes(value));
  const removed = previousCheckedValues.value.filter(value => !newCheckedValues.includes(value));
  console.log('新增:', added);
  console.log('移除:', removed);
  isBatchOperating.value = true;
  
  try {
    if (added.length > 0) {
      const itemsToAdd = added.map(item => {
        const [id, wpid] = item.split('Φ');
        return { id, wpid };
      });
      
      const res = await http.post('/api/add_my_work_batch', {
        code: userStore.userInfo.userCode,
        items: itemsToAdd
      });
      if (res.success) {
        load(); // 重新加载数据
      } else {
        showToast('添加失败');
      }
    }
    
    if (removed.length > 0) {
      const itemsToRemove = removed.map(item => {
        const [id, wpid] = item.split('Φ');
        return { id, wpid };
      });
      
      const res = await http.post('/api/del_my_work_batch', {
        code: userStore.userInfo.userCode,
        items: itemsToRemove
      });
      if(res.success) {
        load(); // 重新加载数据
      } else {
        showToast('添加失败');
      }
    }
    
    updatePrices();
    
  } catch (error) {
    console.error('批量操作失败:', error);
    showToast('操作失败');
  } finally {
    isBatchOperating.value = false;
    previousCheckedValues.value = [...newCheckedValues];
  }
};


const formatDate = (date) => {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

const onConfirm = (value) => {
  show.value = false;
  date.value = formatDate(value);
  load();
};

// const load = async () => {
//   const res = await http.post('/api/get_my_wp_list', { userCode: userStore.userInfo.userCode, qdate: date.value });
//   list.value = res.data;
//   if (res.data) {
//     const defaultChecked = res.data.filter(item => item.dianlanstate === 1).map(item => item.id+'Φ'+item.wpid);
//     checked.value = defaultChecked;
//     previousCheckedValues.value = defaultChecked;
    
//     // 计算总产值和已确认价格
//     totalCheckedPrice.value = res.data
//       .filter(item => defaultChecked.includes(item.id + 'Φ' + item.wpid))
//       .reduce((total, item) => total + (item.baseprice || 0), 0);

//     totalConfirmedPrice.value = res.data
//       .filter(item => defaultChecked.includes(item.id + 'Φ' + item.wpid) && item.state === 1)
//       .reduce((total, item) => total + (item.baseprice || 0), 0);
//   }
// };
const load = async () => {
  const res = await http.post('/api/get_my_wp_list', { 
    userCode: userStore.userInfo.userCode, 
    qdate: date.value 
  });
  
  list.value = res.data || [];
  
  // 默认选中当前用户可操作且 dianlanstate === 1 的项目
  const defaultChecked = res.data
    .filter(item => 
      item.dianlanstate === 1 && 
      (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
    )
    .map(item => item.id + 'Φ' + item.wpid);
  
  checked.value = defaultChecked;
  previousCheckedValues.value = defaultChecked;
  
  // 计算总产值（只包含当前用户可操作的项目）
  totalCheckedPrice.value = res.data
    .filter(item => 
      defaultChecked.includes(item.id + 'Φ' + item.wpid) &&
      (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
    )
    .reduce((total, item) => total + (item.baseprice || 0), 0);

  // 计算已确认价格（只包含当前用户可操作且已确认的项目）
  totalConfirmedPrice.value = res.data
    .filter(item => 
      defaultChecked.includes(item.id + 'Φ' + item.wpid) && 
      item.state === 1 &&
      (item.fin_user === null || item.fin_user === userStore.userInfo.userCode)
    )
    .reduce((total, item) => total + (item.baseprice || 0), 0);
};

const checkTodayUploadRecord = async () => {
  try {
    const res = await http.post('/api/check_today_upload', { 
      userCode: userStore.userInfo.userCode 
    });
    hasTodayUploadRecord.value = res.data?.hasRecord || false;
  } catch (error) {
    console.error('检查上传记录失败:', error);
    hasTodayUploadRecord.value = false;
  }
};


onMounted(async() => {
  load();
  await checkTodayUploadRecord(); // 新增检查方法
});
</script>

<style scoped>
.container {
  padding: 20px;
  padding-bottom: 80px; /* 为底部操作栏留出空间 */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.checkbox {
  margin-bottom: 10px;
  padding: 10px 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  line-height: 2;
  font-size: 0.8rem;
}

.price-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.35rem;
  line-height: 1.2;
}

.price-line {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.price-line span:first-child {
  font-weight: bold;
  margin-right: 5px;
}

.empty-tip {
  padding: 20px;
  text-align: center;
  color: #969799;
}

/* 折叠面板样式 */
.collapse-container {
  margin-top: 10px;
}

/* 无缩进折叠面板 */
.no-indent :deep(.van-collapse-item__content) {
  padding: 0;
}

.no-indent :deep(.van-collapse-item__wrapper) {
  padding: 0;
}


:deep(.van-collapse-item__title) span {

  font-size: 0.4rem;
  color: #000;
}
/* 折叠面板之间的分割线 */
:deep(.van-collapse-item::after) {
  border-bottom: 1px solid #f5f5f5;
}

/* 接线包弹窗样式 */
.cart-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cart-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.cart-item {
  padding: 8px 0;
}

.item-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.item-desc {
  color: #666;
  font-size: 0.3rem;
  margin-bottom: 4px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-price {
  margin-left: auto;
  color: #f44;
  font-weight: bold;
}

.cart-footer {
  padding: 10px;
  background: #fff;
  border-top: 1px solid #f5f5f5;
}

/* 购物车图标动画 */
.scale-animation {
  animation: scale 0.5s;
}

.custom-file-item {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 压缩状态图标 */
.compress-icon {
  position: absolute;
  top: 5px;
  right: 5px;
  color: #ff976a;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  padding: 3px;
}

@keyframes scale {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>