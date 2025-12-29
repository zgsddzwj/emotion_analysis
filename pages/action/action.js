const config = require("../../utils/config");
const { analyzeEmotionWithLLM, updateConfig } = require("../../utils/llm");

Page({
  data: {
    actions: [],
    comfortText: "",
    completedActions: [], // 已完成的行动索引
    isRegenerating: false, // 是否正在重新生成
    completedCount: 0, // 已选中的数量
    selectedCountText: "", // 选中数量的友好提示文本
  },

  onLoad() {
    // 更新LLM配置
    updateConfig({
      mode: config.llmMode,
      cloud: config.cloud,
      direct: config.directAPI,
      proxy: config.proxyAPI,
      model: config.model,
    });

    this.loadData();
  },

  loadData() {
    const app = getApp();
    const currentEmotion = app.globalData.currentEmotion;

    if (currentEmotion && currentEmotion.analysis) {
      // 完全使用大模型生成的内容
      const actions = (currentEmotion.analysis.actions || []).map(
        (action, idx) => ({
          ...action,
          isCompleted: false,
        })
      );
      const comfortText = currentEmotion.analysis.comfortText || "";

      this.setData(
        {
          actions: actions,
          comfortText: comfortText,
          completedActions: [],
          completedCount: 0,
          selectedCountText: "",
        },
        () => {
          // 初始化后更新选中状态
          this.updateActionsCompletedState();
        }
      );
    }
  },

  // 更新 actions 的选中状态
  updateActionsCompletedState() {
    const completedActions = this.data.completedActions || [];
    const actions = this.data.actions.map((action, idx) => ({
      ...action,
      isCompleted: completedActions.includes(Number(idx)),
    }));

    // 计算选中数量并生成友好提示
    const completedCount = completedActions.length;
    let selectedCountText = "";
    if (completedCount === 1) {
      selectedCountText = "你已经选择了一条，很棒！";
    } else if (completedCount === 2) {
      selectedCountText = "你已经选择了两条，非常棒！";
    } else if (completedCount === 3) {
      selectedCountText = "你已经选择了三条，太棒了！";
    } else if (completedCount > 3) {
      selectedCountText = `你已经选择了 ${completedCount} 条，太棒了！`;
    }

    this.setData({
      actions: actions,
      completedCount: completedCount,
      selectedCountText: selectedCountText,
    });
  },

  // 重新生成建议
  async regenerateTap() {
    const app = getApp();
    const currentEmotion = app.globalData.currentEmotion;

    if (!currentEmotion || !currentEmotion.text) {
      wx.showToast({
        title: "无法重新生成",
        icon: "none",
      });
      return;
    }

    // 显示加载状态
    this.setData({ isRegenerating: true });
    wx.showLoading({
      title: "正在重新生成...",
      mask: true,
    });

    try {
      // 重新调用大模型
      const analysis = await analyzeEmotionWithLLM(currentEmotion.text);

      // 如果是违法内容，显示拒绝消息
      if (analysis.isIllegalContent === true) {
        wx.hideLoading();
        this.setData({ isRegenerating: false });
        wx.showModal({
          title: "提示",
          content:
            analysis.rejectionMessage ||
            "我理解你可能正在经历困难，但这里只能提供情绪支持。如果你有违法或伤害他人的想法，建议你寻求专业帮助或联系相关机构。",
          showCancel: false,
          confirmText: "我知道了",
          confirmColor: "#8b7355",
        });
        return;
      }

      // 如果是非情绪内容，显示友善提醒
      if (analysis.isNonEmotionContent === true) {
        wx.hideLoading();
        this.setData({ isRegenerating: false });
        wx.showToast({
          title:
            analysis.reminderMessage ||
            "这里是情绪记录本，一个专门提供情绪支持的空间。如果你有情绪困扰或需要倾诉，我很愿意倾听。",
          icon: "none",
          duration: 3000,
        });
        return;
      }

      // 如果不是情绪问题，显示友好提示
      if (analysis.isEmotionIssue === false) {
        wx.hideLoading();
        this.setData({ isRegenerating: false });
        wx.showToast({
          title: analysis.friendlyMessage || "你好！这里是情绪记录本",
          icon: "none",
          duration: 3000,
        });
        return;
      }

      // 更新全局数据
      app.globalData.currentEmotion.analysis = analysis;

      // 更新页面数据
      const actions = (analysis.actions || []).map((action, idx) => ({
        ...action,
        isCompleted: false,
      }));

      this.setData({
        actions: actions,
        comfortText: analysis.comfortText || "",
        completedActions: [], // 重置完成状态
        completedCount: 0,
        selectedCountText: "",
        isRegenerating: false,
      });

      wx.hideLoading();
      wx.showToast({
        title: "已重新生成",
        icon: "success",
        duration: 1500,
      });
    } catch (error) {
      console.error("重新生成失败:", error);
      wx.hideLoading();
      this.setData({ isRegenerating: false });

      wx.showModal({
        title: "重新生成失败",
        content: error.message || "请稍后再试",
        showCancel: false,
        confirmText: "知道了",
      });
    }
  },

  // 标记行动完成
  completeAction(e) {
    // 获取索引，确保是数字类型
    const index = Number(e.currentTarget.dataset.index);
    let completedActions = [...(this.data.completedActions || [])].map((i) =>
      Number(i)
    ); // 确保数组中的值都是数字

    // 检查是否已选中
    const isCompleted = completedActions.includes(index);

    if (isCompleted) {
      // 如果已完成，取消完成
      completedActions = completedActions.filter((i) => i !== index);
    } else {
      // 标记为完成
      completedActions.push(index);
      // 显示鼓励反馈
      wx.showToast({
        title: "很棒！你做到了",
        icon: "success",
        duration: 2000,
      });
    }

    // 更新状态
    this.setData(
      {
        completedActions: completedActions,
      },
      () => {
        // 状态更新后，更新 actions 的选中状态
        this.updateActionsCompletedState();
      }
    );

    console.log(
      "当前选中状态:",
      completedActions,
      "点击的索引:",
      index,
      "类型:",
      typeof index
    );
  },

  knowTap() {
    // 返回首页
    wx.redirectTo({
      url: "/pages/index/index",
    });
  },

  recordTap() {
    // 保存记录并跳转到历史页
    const app = getApp();
    const currentEmotion = app.globalData.currentEmotion;

    if (currentEmotion) {
      const now = new Date();
      const record = {
        date: now.toLocaleDateString("zh-CN"),
        time: now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: currentEmotion.timestamp,
        // 保存完整的用户输入
        fullText: currentEmotion.text,
        // 保存预览文本（用于列表显示）
        text:
          currentEmotion.text.substring(0, 50) +
          (currentEmotion.text.length > 50 ? "..." : ""),
        // 保存完整的分析结果
        analysis: {
          emotions: currentEmotion.analysis.emotions || [],
          // 保存合并后的所有原因（大模型生成的 + 用户添加的）
          reasons:
            currentEmotion.analysis.allReasons ||
            currentEmotion.analysis.reasons ||
            [],
          userReasons: currentEmotion.analysis.userReasons || [],
          clarification: currentEmotion.analysis.clarification || "",
          actions: currentEmotion.analysis.actions || [],
          comfortText: currentEmotion.analysis.comfortText || "",
        },
        // 保存用户完成的行动索引
        completedActions: this.data.completedActions || [],
      };

      if (!app.globalData.emotionHistory) {
        app.globalData.emotionHistory = [];
      }
      app.globalData.emotionHistory.unshift(record);

      // 只保留最近50条记录
      if (app.globalData.emotionHistory.length > 50) {
        app.globalData.emotionHistory = app.globalData.emotionHistory.slice(
          0,
          50
        );
      }

      // 保存到本地存储
      app.saveEmotionHistory();

      // 显示保存成功提示
      wx.showToast({
        title: "已保存",
        icon: "success",
        duration: 1500,
      });
    }

    setTimeout(() => {
      wx.redirectTo({
        url: "/pages/history/history",
      });
    }, 500);
  },
});
