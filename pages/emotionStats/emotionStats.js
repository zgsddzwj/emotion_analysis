Page({
  data: {
    emotionStats: [],
    totalRecords: 0,
    isEmpty: false,
  },

  onLoad() {
    this.calculateEmotionStats();
  },

  onShow() {
    // 每次显示时刷新数据
    this.calculateEmotionStats();
  },

  // 跳转到首页
  goToIndex() {
    wx.redirectTo({
      url: "/pages/index/index",
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 计算所有情绪统计
  calculateEmotionStats() {
    const app = getApp();
    app.loadEmotionHistory();
    const history = app.globalData.emotionHistory || [];

    if (history.length === 0) {
      this.setData({
        emotionStats: [],
        totalRecords: 0,
        isEmpty: true,
      });
      return;
    }

    // 统计所有情绪出现频率
    const emotionCount = {};
    const emotionEmojiMap = {}; // 存储每个情绪对应的 emoji

    history.forEach((record) => {
      // 优先使用 analysis.emotions，兼容旧数据格式
      const emotions =
        record.analysis && record.analysis.emotions
          ? record.analysis.emotions
          : record.emotions || [];

      if (Array.isArray(emotions) && emotions.length > 0) {
        emotions.forEach((emotion) => {
          // 兼容不同的数据结构
          const label = emotion.label || emotion;
          const emoji = emotion.emoji || "😔";

          if (label) {
            emotionCount[label] = (emotionCount[label] || 0) + 1;
            // 保存第一个出现的 emoji
            if (!emotionEmojiMap[label]) {
              emotionEmojiMap[label] = emoji;
            }
          }
        });
      }
    });

    // 转换为数组并排序
    const emotionEntries = Object.entries(emotionCount);
    if (emotionEntries.length === 0) {
      this.setData({
        emotionStats: [],
        totalRecords: history.length,
        isEmpty: true,
      });
      return;
    }

    // 按频率排序
    emotionEntries.sort((a, b) => b[1] - a[1]);

    // 计算总情绪次数（可能一条记录有多个情绪）
    const totalEmotionCount = emotionEntries.reduce(
      (sum, [, count]) => sum + count,
      0
    );

    // 生成统计数据
    const emotionStats = emotionEntries.map(([label, count]) => ({
      label: label,
      emoji: emotionEmojiMap[label] || "😔",
      count: count,
      percentage: Math.round((count / totalEmotionCount) * 100),
    }));

    this.setData({
      emotionStats: emotionStats,
      totalRecords: history.length,
      isEmpty: false,
    });
  },
});
