const config = require("./utils/config");

App({
  onLaunch() {
    // 初始化云开发（如果使用云开发模式）
    if (config.llmMode === "cloud" && config.enableLLM) {
      if (!wx.cloud) {
        console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      } else {
        // 如果环境ID未配置，使用动态环境（自动使用当前环境）
        const envId =
          config.cloud.env && config.cloud.env !== "your-cloud-env-id"
            ? config.cloud.env
            : undefined; // undefined 表示使用动态环境

        wx.cloud.init({
          env: envId, // 云开发环境ID，如果未配置则使用动态环境
          traceUser: true,
        });

        if (!envId) {
          console.warn(
            "⚠️ 云开发环境ID未配置，使用动态环境。建议配置固定环境ID以提高稳定性。"
          );
        }
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
