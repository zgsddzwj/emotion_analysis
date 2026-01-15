Page({
  data: {
    records: [],
    trendText: "",
    trendStats: null, // 趋势统计数据
    originalRecords: [],
    searchKeyword: "",
    editingIndex: -1,
    editingText: "",
  },

  onLoad() {
    this.loadRecords();
    this.calculateTrend();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadRecords();
    this.calculateTrend();
  },

  loadRecords() {
    const app = getApp();
    // 从本地存储重新加载，确保数据最新
    app.loadEmotionHistory();
    const history = app.globalData.emotionHistory || [];

    // 兼容旧数据格式，确保每条记录都有必要字段
    const normalizedHistory = history.map((record, index) => {
      // 如果没有analysis字段，创建兼容结构
      if (!record.analysis && record.emotions) {
        record.analysis = {
          emotions: record.emotions || [],
          reasons: [],
          clarification: "",
          actions: [],
          comfortText: "",
        };
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

      return record;
    });

    // 生成最终记录
    const records = normalizedHistory.map((record) => ({
      ...record,
      date:
        record.timestamp &&
        new Date(record.timestamp).toLocaleDateString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
        }),
    }));

    this.setData(
      {
        originalRecords: records,
      },
      () => {
        this.applyFilters();
      }
    );
  },

  // 搜索
  applyFilters() {
    const { originalRecords, searchKeyword } = this.data;
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      this.setData({ records: originalRecords });
      return;
    }

    const filtered = originalRecords.filter((r) => {
      const text = (r.text || "").toLowerCase();
      const reasons = (r.analysis?.reasons || []).join(" ").toLowerCase();
      return text.includes(keyword) || reasons.includes(keyword);
    });

    this.setData({ records: filtered });
  },

  onSearchInput(e) {
    this.setData(
      {
        searchKeyword: e.detail.value,
      },
      () => this.applyFilters()
    );
  },

  calculateTrend() {
    const app = getApp();
    const history = app.globalData.emotionHistory || [];

    if (history.length === 0) {
      this.setData({
        trendText: "",
        trendStats: null,
      });
      return;
    }

    // 统计最近一周的情绪
    const oneWeekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
    const recentRecords = history.filter((r) => r.timestamp >= oneWeekAgo);

    if (recentRecords.length === 0) {
      this.setData({
        trendText: "",
        trendStats: null,
      });
      return;
    }

    // 统计情绪出现频率
    const emotionCount = {};
    recentRecords.forEach((record) => {
      // 优先使用 analysis.emotions，兼容旧数据格式
      const emotions =
        record.analysis && record.analysis.emotions
          ? record.analysis.emotions
          : record.emotions || [];

      if (Array.isArray(emotions) && emotions.length > 0) {
        emotions.forEach((emotion) => {
          // 兼容不同的数据结构
          const label = emotion.label || emotion;
          if (label) {
            emotionCount[label] = (emotionCount[label] || 0) + 1;
          }
        });
      }
    });

    // 找出出现最多的情绪
    const emotionEntries = Object.entries(emotionCount);
    if (emotionEntries.length === 0) {
      this.setData({
        trendText: "",
        trendStats: null,
      });
      return;
    }

    // 按频率排序
    emotionEntries.sort((a, b) => b[1] - a[1]);
    const topEmotions = emotionEntries.slice(0, 3);

    // 生成趋势文本
    let trendText = "";
    if (topEmotions.length > 0) {
      const [topEmotion, topCount] = topEmotions[0];
      if (topCount >= 2) {
        trendText = `最近一周，你记录了 ${recentRecords.length} 次情绪`;
        if (topEmotions.length === 1) {
          trendText += `，「${topEmotion}」出现 ${topCount} 次`;
        } else if (topEmotions.length === 2) {
          const [emotion2, count2] = topEmotions[1];
          trendText += `，「${topEmotion}」和「${emotion2}」出现较多`;
        } else {
          trendText += `，主要情绪是「${topEmotion}」`;
        }
      } else {
        trendText = `最近一周，你记录了 ${recentRecords.length} 次情绪`;
      }
    }

    // 计算情绪变化趋势（对比更早的一周）
    const twoWeeksAgo = new Date().getTime() - 14 * 24 * 60 * 60 * 1000;
    const earlierRecords = history.filter(
      (r) => r.timestamp >= twoWeeksAgo && r.timestamp < oneWeekAgo
    );

    let trendDirection = "";
    if (earlierRecords.length > 0) {
      if (recentRecords.length > earlierRecords.length) {
        trendDirection = "记录频率有所增加，说明你更关注自己的情绪了";
      } else if (recentRecords.length < earlierRecords.length) {
        trendDirection = "记录频率有所减少";
      }
    }

    // 生成统计数据
    const trendStats = {
      recentCount: recentRecords.length,
      totalCount: history.length,
      topEmotions: topEmotions.map(([emotion, count]) => ({
        label: emotion,
        count: count,
        percentage: Math.round((count / recentRecords.length) * 100),
      })),
      trendDirection: trendDirection,
    };

    this.setData({
      trendText: trendText,
      trendStats: trendStats,
    });
  },

  // 编辑记录
  editRecord(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.records[index];
    if (!record) return;
    this.setData({
      editingIndex: index,
      editingText: record.text || "",
    });
  },

  onEditingInput(e) {
    this.setData({ editingText: e.detail.value });
  },

  saveEdit() {
    const { editingIndex, editingText, records, originalRecords } = this.data;
    if (editingIndex < 0) return;
    const newText = editingText.trim();
    const updatedRecords = records.map((r, idx) =>
      idx === editingIndex ? { ...r, text: newText } : r
    );

    // 同步回原始数据
    const target = records[editingIndex];
    const globalIndex = originalRecords.findIndex(
      (item) => item.timestamp === target.timestamp
    );
    if (globalIndex >= 0) {
      originalRecords[globalIndex].text = newText;
    }

    // 保存到全局存储
    const app = getApp();
    app.globalData.emotionHistory = originalRecords;
    app.saveEmotionHistory && app.saveEmotionHistory();

    this.setData({
      records: updatedRecords,
      originalRecords,
      editingIndex: -1,
      editingText: "",
    });
  },

  cancelEdit() {
    this.setData({
      editingIndex: -1,
      editingText: "",
    });
  },

  deleteRecord(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.records[index];
    if (!record) return;

    wx.showModal({
      title: "确认删除",
      content: "删除后不可恢复，确定删除吗？",
      confirmText: "删除",
      confirmColor: "#d24d4d",
      success: (res) => {
        if (res.confirm) {
          const filteredRecords = this.data.records.filter(
            (_, idx) => idx !== index
          );
          const originalRecords = this.data.originalRecords.filter(
            (item) => item.timestamp !== record.timestamp
          );

          // 保存到全局存储
          const app = getApp();
          app.globalData.emotionHistory = originalRecords;
          app.saveEmotionHistory && app.saveEmotionHistory();

          this.setData(
            {
              records: filteredRecords,
              originalRecords,
            },
            () => {
              this.calculateTrend();
            }
          );
        }
      },
    });
  },


  // 查看详情
  viewDetail(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.records[index];

    if (record) {
      // 将记录数据传递到详情页
      wx.navigateTo({
        url: `/pages/detail/detail?index=${index}&ts=${record.timestamp || ""}`,
      });
    }
  },

  backTap() {
    wx.redirectTo({
      url: "/pages/index/index",
    });
  },

  // 查看所有情绪分布
  viewAllEmotions() {
    wx.navigateTo({
      url: "/pages/emotionStats/emotionStats",
    });
  },
});
