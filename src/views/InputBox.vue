<template>
  <div class="input-container">
    <button @click="toggleGenerateImage"
      :class="['generate-image-button', { 'active': isGenerateImage }]">开启文生图</button>
    <input ref="input" v-model="localQuestion" type="text" placeholder="请输入问题" @keydown.enter="sendRequest" />
    <button @click="sendRequest" class="send-button">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 0L0 12H12L6 0Z" fill="#FFFFFF" />
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    question: {
      type: String,
      required: true,
    },
    isGenerateImage: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:question', 'send-request', 'generate-image'],
  computed: {
    localQuestion: {
      get() {
        return this.question;
      },
      set(newQuestion) {
        this.$emit('update:question', newQuestion);
      },
    },
  },
  methods: {
    sendRequest() {
      this.$emit('send-request');
      this.$emit('update:question', '');
    },
    clearInput() {
      this.$refs.input.value = '';
    },
    toggleGenerateImage() {
      this.$emit('generate-image');
    },
  },
};
</script>

<style scoped>
.input-container {
  position: relative;
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  border: 1px solid #ced4da;
  border-radius: 8px;
  background-color: #fff;
  height: 180px;
  /* 将高度增加到三倍 */
  overflow: hidden;
}

.input-container input {
  flex: 1;
  padding: 60px 50px 60px 40px;
  /* 调整内边距以适应新的高度 */
  margin-right: 0;
  box-sizing: border-box;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  height: 100%;
}

.send-button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background-color: #66ccff;
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
  background-color: #66ccff;
}

.send-button svg {
  width: 12px;
  height: 12px;
}

.generate-image-button {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 10px;
  background-color: #f8f9fa;
  color: #000;
  border: 1px solid #ced4da;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.generate-image-button.active {
  background-color: #66ccff;
  color: #fff;
  border-color: #66ccff;
}

.generate-image-button:hover {
  background-color: #66ccff;
  color: #fff;
  border-color: #66ccff;
}
</style>