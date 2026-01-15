Page({
  data: {
    emotions: [],
    reasons: [], // 大模型生成的原因（只读）
    userReasons: [], // 用户自己添加的原因
    clarification: "",
    customReasonInput: "", // 用户输入的自定义原因
    intensityLabel: "",
    compareText: "",
  },

  onLoad() {
    const app = getApp();
    const currentEmotion = app.globalData.currentEmotion;

    if (currentEmotion && currentEmotion.analysis) {
      // 确保reasons是数组
      const reasons = currentEmotion.analysis.reasons || [];
      // 区分大模型生成的原因和用户添加的原因
      const userReasons = currentEmotion.analysis.userReasons || [];
      this.setData({
        emotions: currentEmotion.analysis.emotions || [],
        reasons: Array.isArray(reasons) ? reasons : [],
        userReasons: Array.isArray(userReasons) ? userReasons : [],
        clarification: currentEmotion.analysis.clarification || "",
        intensityLabel: this.calculateIntensity(
          currentEmotion.analysis.emotions || [],
          reasons
        ),
        compareText: this.buildCompareText(app.globalData.emotionHistory || []),
      });
    } else {
      // 如果没有数据，返回首页
      wx.redirectTo({
        url: "/pages/index/index",
      });
    }
  },

  // 计算情绪强度（简单规则）
  calculateIntensity(emotions = [], reasons = []) {
    const emotionCount = emotions.length;
    const reasonCount = reasons.length;
    const score = emotionCount * 1.5 + reasonCount * 1;
    if (score >= 6) return "强烈";
    if (score >= 3) return "中等";
    return "轻微";
  },

  // 与上一条记录做简单对比
  buildCompareText(history = []) {
    if (!history || history.length < 2) return "这是你的最新一次记录";
    const [latest, previous] = history;
    if (!previous || !previous.analysis) return "这是你的最新一次记录";
    const prevEmotion =
      previous.analysis.emotions?.[0]?.label ||
      previous.emotions?.[0]?.label ||
      "上一条记录";
    return `与上一条记录相比，本次情绪与你上次的「${prevEmotion}」有所不同`;
  },

  // 用户自定义原因输入
  onCustomReasonInput(e) {
    this.setData({
      customReasonInput: e.detail.value,
    });
  },

  // 添加用户自定义原因
  addCustomReason() {
    const value = this.data.customReasonInput.trim();
    if (!value) {
      wx.showToast({
        title: "请输入原因",
        icon: "none",
        duration: 1500,
      });
      return;
    }

    const userReasons = [...this.data.userReasons];
    userReasons.push(value);

    this.setData({
      userReasons: userReasons,
      customReasonInput: "",
    });

    // 更新全局数据
    this.updateGlobalData();
  },

  // 删除用户自定义原因
  deleteUserReason(e) {
    const index = e.currentTarget.dataset.index;
    const userReasons = [...this.data.userReasons];
    userReasons.splice(index, 1);

    this.setData({
      userReasons: userReasons,
    });

    // 更新全局数据
    this.updateGlobalData();
  },

  // 更新全局数据
  updateGlobalData() {
    const app = getApp();
    if (
      app.globalData.currentEmotion &&
      app.globalData.currentEmotion.analysis
    ) {
      // 保存用户添加的原因
      app.globalData.currentEmotion.analysis.userReasons =
        this.data.userReasons;
      // 合并所有原因（用于保存记录）
      app.globalData.currentEmotion.analysis.allReasons = [
        ...this.data.reasons,
        ...this.data.userReasons,
      ];
    }
  },

  nextTap() {
    // 如果有未保存的自定义原因输入，先保存
    const value = this.data.customReasonInput.trim();
    if (value) {
      this.addCustomReason();
    }

    wx.navigateTo({
      url: "/pages/action/action",
    });
  },
});
