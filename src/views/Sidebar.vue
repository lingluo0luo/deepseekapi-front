<!-- src/components/Sidebar.vue -->
<template>
  <div class="sidebar" :class="{ 'sidebar-expanded': isExpanded }" @click="toggleSidebar">
    <!-- A1 点击侧边栏的时候触发toggleSidebar -->
    <!-- 侧边栏内容 -->
    <div class="sidebar-content" v-if="isExpanded">
      <!-- 侧边栏具体内容 -->
      <p>侧边栏内容</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isExpanded: false, //定义数据"是否展开"
    };
  },
  methods: {
    toggleSidebar() {
      this.isExpanded = !this.isExpanded;//A2 因为点击 所以在这里调用到toggleSidebar事件 并且更改isExpanded的状态
      this.$emit('toggle-sidebar', this.isExpanded);// //A3 调用父组件的toggleSidebar事件 把isExpanded传递给父组件
    },
  },
};
</script>

<style scoped>
.sidebar {
  width: 40px;
  /* 初始宽度 */
  background-color: #66ccff;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  border-radius: 8px 0 0 8px;
  transition: width 0.3s ease;
  overflow: hidden;
  position: relative;
  height: 100vh;
  /* 确保侧边栏高度占满整个视口 */
  margin: 0;
  /* 移除外边距 */
  padding: 0;
  /* 移除外边距 */
}

.sidebar-expanded {
  width: 250px;
  /* 展开后的宽度 */
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
  padding: 20px 0;
  /* 仅保留顶部和底部的内边距 */
  margin: 0;
  /* 移除外边距 */
}
</style>