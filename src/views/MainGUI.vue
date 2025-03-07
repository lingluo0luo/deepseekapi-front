<template>
  <div class="main-gui">
    <Sidebar @toggle-sidebar="handleSidebarToggle" />
    <div class="content" :class="{ 'content-with-sidebar': isSidebarExpanded }">
      <div class="display-area" ref="displayArea">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="error" class="error">加载失败: {{ error }}</div>
        <div v-else-if="sortedHistory.length === 0" class="waiting">
          <div class="waiting-message">等待您的询问</div>
          <div class="waiting-time">{{ currentTime }}</div>
        </div>
        <div v-else class="history">
          <div v-for="item in sortedHistory" :key="item.id" class="history-item">
            <div class="user-question">
              <strong>您:</strong> {{ item.userPrompt }}
            </div>
            <div class="response">
              <div v-if="item.isLoading" class="loading">加载中...</div>
              <img v-else-if="item.type === 'image'" :src="item.imageData" @load="scrollToBottom" />
              <pre v-else>{{ item.aiResponse || item.data }}</pre>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-box">
        <InputBox :question="question" @update:question="updateQuestion" @send-request="sendRequest"
          @generate-image="toggleGenerateImage" :isGenerateImage="isGenerateImage" />
      </div>
    </div>
  </div>
</template>

<script>
import { get, post } from '../utils/request.js';
import Sidebar from '../views/Sidebar.vue';
import InputBox from '../views/InputBox.vue';

export default {
  components: {
    Sidebar,
    InputBox,
  },
  data() {
    return {
      loading: false,
      error: null,
      data: null,
      question: '',
      isSidebarExpanded: false,
      currentTime: new Date().toLocaleTimeString(),
      imageData: '',
      isGenerateImage: false,
      history: [],
    };
  },
  computed: {
    sortedHistory() {
      // 修改为时间倒序排列（新 → 旧）
      return [...this.history].sort((a, b) => b.generatedAt - a.generatedAt);
    }
  },
  watch: {
    // 当历史记录变化时自动滚动到底部
    sortedHistory() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  },
  created() {
    this.updateTime();
    this.fetchHistory();
    this.$nextTick(() => {
      this.scrollToBottom();
    });
  },
  methods: {
    isValidImage(src) {
      return src && (src.startsWith('data:image') || src.startsWith('blob:'));
    },
    async sendRequest() {
      if (!this.question) {
        this.error = '请输入问题';
        return;
      }

      let loadingEntry; // 定义在方法顶部

      try {
        this.error = null;

        // 添加临时加载项
        loadingEntry = {
          id: Date.now(),
          userPrompt: this.question,
          generatedAt: new Date(),
          isLoading: true, // 新增字段标识加载状态
        };
        this.history.push(loadingEntry);

        let response;

        const newEntry = {
          id: loadingEntry.id, // 使用相同的 id
          userPrompt: this.question,
          generatedAt: new Date(),
        };

        if (this.isGenerateImage) {
          response = await post('http://localhost:8080/api/generate-image',
            { text: this.question },
            { responseType: 'arraybuffer' }
          );
          const blob = new Blob([response], { type: 'image/png' });
          newEntry.imageData = URL.createObjectURL(blob);
          newEntry.type = 'image';
        } else {
          response = await post('http://localhost:8080/tall', {
            question: this.question,
          });
          newEntry.aiResponse = response.data;
          newEntry.type = 'text';
        }

        // 更新历史记录中的加载项
        const index = this.history.findIndex(item => item.id === newEntry.id);
        if (index !== -1) {
          this.history[index] = newEntry; // 直接赋值
        }

      } catch (error) {
        this.error = error.message;
        // 移除加载项
        if (loadingEntry) { // 确保 loadingEntry 存在
          this.history = this.history.filter(item => item.id !== loadingEntry.id);
        }
      } finally {
        this.question = '';
        this.isGenerateImage = false;
        this.history = this.history.map(item => {
          return item.id === newEntry.id ? newEntry : item;
        });
        this.$nextTick(() => {
          setTimeout(this.scrollToBottom, 100); // 添加延迟确保图片渲染完成
        });
      }
    },
    async fetchHistory() {
      try {
        const response = await get('http://localhost:8080/api/history');

        const newHistory = response.map(item => {
          let imageData = item.imageData;
          if (imageData && !imageData.startsWith('data:image')) {
            imageData = `data:image/png;base64,${imageData}`;
          }
          return {
            id: item.id,
            userPrompt: this.parseUserPrompt(item.userPrompt),
            imageData: imageData,
            aiResponse: item.aiResponse,
            type: item.imageData ? 'image' : 'text',
            generatedAt: new Date(item.generatedAt)
          };
        });

        // 合并新历史记录，避免覆盖加载项
        this.history = this.history.filter(item => !item.isLoading).concat(newHistory);

      } catch (error) {
        console.error('获取历史记录失败:', error);
      }
    },
    parseUserPrompt(userPrompt) {
      try {
        const parsed = JSON.parse(userPrompt);
        return parsed.text || parsed.question || userPrompt;
      } catch (e) {
        return userPrompt;
      }
    },
    toggleGenerateImage() {
      this.isGenerateImage = !this.isGenerateImage;
    },
    handleSidebarToggle(isExpanded) {
      this.isSidebarExpanded = isExpanded;
    },
    updateQuestion(newQuestion) {
      this.question = newQuestion;
    },
    updateTime() {
      setInterval(() => {
        this.currentTime = new Date().toLocaleTimeString();
      }, 1000);
    },
    scrollToBottom() {
      const container = this.$refs.displayArea;
      if (container) {
        // 添加平滑滚动效果
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }
};
</script>

<style scoped>
/* 新增聊天容器反向布局 */
.history {
  display: flex;
  flex-direction: column-reverse;
  /* 关键修改：使新消息显示在底部 */
  gap: 20px;
}

/* 调整原有样式确保布局正确 */
.display-area {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: calc(100vh - 180px);
}

/* 保持其他样式不变 */
.user-question {
  background-color: #e3f2fd;
  align-self: flex-end;
  margin-right: 20px;
  max-width: 70%;
}

.response {
  background-color: #f5f5f5;
  align-self: flex-start;
  margin-left: 20px;
  max-width: 70%;
}

/* 其他原有样式保持不变 */
/* ...（保持原有其他样式不变）... */
.main-gui {
  display: flex;
  height: 100vh;
  background-color: #f0f2f5;
  margin: 0;
  padding: 0;
}

.content {
  width: calc(100% - 40px);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.content-with-sidebar {
  width: calc(100% - 270px);
}

.display-area {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  /* 添加滚动条 */
  max-height: calc(100vh - 180px);
  /* 设置最大高度 */
}

.loading,
.error,
.data,
.waiting {
  padding: 10px;
}

.loading {
  color: #007bff;
}

.error {
  color: #dc3545;
}

.data {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.conversation {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.user-question,
.response {
  padding: 15px;
  border-radius: 8px;
  max-width: 45%;
}

.user-question {
  background-color: #e3f2fd;
  align-self: flex-end;
  margin-right: 20px;
}

.response {
  background-color: #f5f5f5;
  align-self: flex-start;
  margin-left: 20px;
}

.response pre {
  background: none;
  padding: 0;
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
}

.response img {
  max-width: 100%;
  margin-top: 20px;
  display: block;
}

strong {
  color: #1976d2;
  margin-bottom: 5px;
  display: block;
}

.waiting-message {
  font-size: 16px;
  color: #555;
}

.waiting-time {
  font-size: 14px;
  color: #888;
  margin-top: 5px;
}

.dialog-box {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin: 0;
  padding: 0;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
}

.input-container input {
  flex: 1;
  padding: 20px 50px 20px 20px;
  margin-right: 0;
  box-sizing: border-box;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
  height: 60px;
}

.send-button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background-color: #007bff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.send-button:hover {
  background-color: #0056b3;
}

.send-button svg {
  width: 12px;
  height: 12px;
}

.generate-image-button {
  margin-left: 10px;
  padding: 10px 20px;
  background-color: #f8f9fa;
  color: #000;
  border: 1px solid #ced4da;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.generate-image-button.active {
  background-color: #007bff;
  color: #fff;
  border-color: #007bff;
}

.generate-image-button:hover {
  background-color: #0056b3;
  color: #fff;
  border-color: #0056b3;
}

.history-item {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item .user-question,
.history-item .response {
  padding: 10px;
  border-radius: 8px;
  max-width: 70%;
}

.history-item .user-question {
  background-color: #e3f2fd;
  align-self: flex-end;
}

.history-item .response {
  background-color: #f5f5f5;
  align-self: flex-start;
}

.history-item .response pre {
  background: none;
  padding: 0;
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
}

.history-item .response img {
  max-width: 100%;
  margin-top: 20px;
  display: block;
}
</style>