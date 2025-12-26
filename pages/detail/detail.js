Page({
  data: {
    record: {},
    index: -1,
  },

  onLoad(options) {
    const index = parseInt(options.index) || 0;
    this.setData({ index: index });
    this.loadRecord(index);
  },

  loadRecord(index) {
    const app = getApp();
    app.loadEmotionHistory();
    const history = app.globalData.emotionHistory || [];

    if (index >= 0 && index < history.length) {
      const record = history[index];

      // 兼容旧数据格式
      if (!record.analysis && record.emotions) {
        record.analysis = {
          emotions: record.emotions || [],
          reasons: [],
          userReasons: [],
          clarification: "",
          actions: [],
          comfortText: "",
        };
      }

      // 如果没有allReasons，使用reasons（兼容旧数据）
      if (!record.analysis.allReasons && record.analysis.reasons) {
        record.analysis.allReasons = record.analysis.reasons;
      }

      // 确保 allReasons 存在且是数组
      if (!record.analysis.allReasons) {
        record.analysis.allReasons = [];
      }

      // 如果没有完整文本，使用预览文本
      if (!record.fullText && record.text) {
        record.fullText = record.text;
      }

      // 如果没有时间，从timestamp生成
      if (!record.time && record.timestamp) {
        const date = new Date(record.timestamp);
        record.time = date.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // 如果没有completedActions字段，初始化为空数组
      if (!record.completedActions) {
        record.completedActions = [];
      }

      // 只保留用户完成的行动建议
      if (
        record.analysis &&
        record.analysis.actions &&
        record.completedActions.length > 0
      ) {
        const completedActions = record.completedActions
          .map((index) => {
            if (record.analysis.actions[index]) {
              return {
                ...record.analysis.actions[index],
                originalIndex: index,
              };
            }
            return null;
          })
          .filter((action) => action !== null);
        record.completedActionsList = completedActions;
      } else {
        record.completedActionsList = [];
      }

      this.setData({
        record: record,
      });
    } else {
      wx.showToast({
        title: "记录不存在",
        icon: "none",
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  backTap() {
    wx.navigateBack();
  },
});
