const config = require("./utils/config");

App({
  onLaunch() {
    // 初始化云开发（如果使用云开发模式）
    if (config.llmMode === "cloud" && config.enableLLM) {
      if (!wx.cloud) {
        console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      } else {
        wx.cloud.init({
          env: config.cloud.env, // 云开发环境ID
          traceUser: true,
        });
      }
    }

    // 从本地存储加载历史记录
    this.loadEmotionHistory();
  },

  // 从本地存储加载历史记录
  loadEmotionHistory() {
    try {
      const history = wx.getStorageSync("emotionHistory");
      if (history && Array.isArray(history)) {
        this.globalData.emotionHistory = history;
        console.log("✅ 已加载历史记录:", history.length, "条");
      } else {
        this.globalData.emotionHistory = [];
      }
    } catch (error) {
      console.error("加载历史记录失败:", error);
      this.globalData.emotionHistory = [];
    }
  },

  // 保存历史记录到本地存储
  saveEmotionHistory() {
    try {
      wx.setStorageSync("emotionHistory", this.globalData.emotionHistory);
      console.log(
        "✅ 已保存历史记录:",
        this.globalData.emotionHistory.length,
        "条"
      );
    } catch (error) {
      console.error("保存历史记录失败:", error);
      // 如果存储空间不足，尝试清理旧数据
      if (error.errMsg && error.errMsg.includes("exceed")) {
        // 只保留最近20条
        this.globalData.emotionHistory = this.globalData.emotionHistory.slice(
          0,
          20
        );
        try {
          wx.setStorageSync("emotionHistory", this.globalData.emotionHistory);
        } catch (e) {
          console.error("清理后保存仍然失败:", e);
        }
      }
    }
  },

  globalData: {
    userInfo: null,
    emotionHistory: [],
  },
});
