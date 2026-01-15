const config = require("../../utils/config");
const { analyzeEmotionWithLLM, updateConfig } = require("../../utils/llm");

Page({
  data: {
    inputText: "",
    hasHistory: false,
    isAnalyzing: false,
    showReminder: false, // 是否显示提醒
    reminderMessage: "", // 提醒消息
    loadingTip: "", // 加载提示信息
    loadingTipIndex: 0, // 当前提示索引
    vibrationEnabled: true,
    quickEmotions: [
      { emoji: "😔", text: "有点丧" },
      { emoji: "😰", text: "有点焦虑" },
      { emoji: "😡", text: "有点生气" },
      { emoji: "😴", text: "有点累" },
      { emoji: "😢", text: "想哭" },
      { emoji: "😕", text: "有点迷茫" },
    ],
  },

  onLoad() {
    this.checkHistory();
    // 更新LLM配置
    updateConfig({
      mode: config.llmMode,
      cloud: config.cloud,
      direct: config.directAPI,
      proxy: config.proxyAPI,
      model: config.model,
    });
    const vibrateSetting = wx.getStorageSync("setting_vibration");
    this.setData({
      vibrationEnabled:
        vibrateSetting === "" || vibrateSetting === undefined
          ? true
          : !!vibrateSetting,
    });
  },

  onShow() {
    this.checkHistory();
  },

  checkHistory() {
    const app = getApp();
    const history = app.globalData.emotionHistory || [];
    this.setData({
      hasHistory: history.length > 0,
    });
  },

  onInput(e) {
    this.setData({
      inputText: e.detail.value,
      // 用户输入时，如果有提醒，先隐藏
      showReminder: false,
      reminderMessage: "",
    });

    // 强制固定 textarea 高度
    this.fixTextareaHeight();
  },

  // 快捷情绪标签点击
  onSelectQuickEmotion(e) {
    const text = e.currentTarget.dataset.text || "";
    // 如果输入为空，直接填充；否则在末尾追加
    const prefix = this.data.inputText
      ? this.data.inputText + (this.data.inputText.endsWith("。") ? "" : "。")
      : "";
    const newText = `${prefix}${text}`;
    this.setData({
      inputText: newText,
      showReminder: false,
      reminderMessage: "",
    });
  },

  // 强制固定 textarea 高度
  fixTextareaHeight() {
    const query = wx.createSelectorQuery();
    query.select(".emotion-input").boundingClientRect();
    query.select(".textarea-wrapper").boundingClientRect();
    query.exec((res) => {
      if (res[0] && res[1]) {
        const textarea = res[0];
        const wrapper = res[1];
        // 如果 textarea 高度不等于 320rpx，强制设置
        if (textarea && textarea.height !== wrapper.height) {
          // 使用 setTimeout 确保在下一帧执行
          setTimeout(() => {
            const query2 = wx.createSelectorQuery();
            query2.select(".emotion-input").fields({
              computedStyle: ["height", "maxHeight", "minHeight"],
            });
            query2.exec();
          }, 0);
        }
      }
    });
  },

  // 关闭提醒
  closeReminder() {
    this.setData({
      showReminder: false,
      reminderMessage: "",
    });
  },

  goToHistory() {
    wx.navigateTo({
      url: "/pages/history/history",
    });
  },

  goSettings() {
    wx.navigateTo({
      url: "/pages/settings/settings",
    });
  },

  goHelp() {
    wx.navigateTo({
      url: "/pages/help/help",
    });
  },

  // 友好的等待提示信息（更多更丰富的提示）
  loadingTips: [
    "正在理解你的感受...",
    "我在认真倾听...",
    "让我为你整理一下...",
    "你的情绪值得被看见...",
    "我在为你准备回应...",
    "稍等片刻，马上就好...",
    "你的感受很重要...",
    "我在仔细思考...",
    "让我为你找到合适的建议...",
    "你的情绪正在被理解...",
    "我在为你准备温暖的回应...",
    "你的每一句话都很重要...",
    "让我为你整理情绪...",
    "我在认真分析...",
    "你的感受正在被看见...",
    "让我为你准备一些建议...",
    "我在为你思考...",
    "你的情绪值得被认真对待...",
  ],

  // 开始轮播加载提示
  startLoadingTips() {
    let index = 0;
    this.setData({
      loadingTip: this.loadingTips[index],
      loadingTipIndex: index,
    });

    this.loadingTipTimer = setInterval(() => {
      index = (index + 1) % this.loadingTips.length;
      this.setData({
        loadingTip: this.loadingTips[index],
        loadingTipIndex: index,
      });
    }, 1500); // 每1.5秒切换一次，让等待更有趣
  },

  // 停止轮播加载提示
  stopLoadingTips() {
    if (this.loadingTipTimer) {
      clearInterval(this.loadingTipTimer);
      this.loadingTipTimer = null;
    }
  },

  async submitTap() {
    const text = this.data.inputText.trim();
    if (!text) {
      return;
    }

    // 显示加载状态
    this.setData({ isAnalyzing: true });
    this.startLoadingTips(); // 开始轮播提示
    if (this.data.vibrationEnabled) {
      wx.vibrateShort({ type: "light" });
    }

    wx.showLoading({
      title: "正在分析...",
      mask: true,
    });

    try {
      let analysis;

      // 根据配置选择使用大模型或本地分析
      if (config.enableLLM) {
        // 使用大模型分析（支持流式输出）
        analysis = await analyzeEmotionWithLLM(text, (tip) => {
          // 流式输出回调，更新提示信息
          if (tip) {
            this.setData({ loadingTip: tip });
          }
        });
      } else {
        // 使用本地关键词匹配（降级方案）
        analysis = this.analyzeEmotion(text);
      }

      // 保存到全局数据
      const app = getApp();
      app.globalData.currentEmotion = {
        text: text,
        analysis: analysis,
        timestamp: new Date().getTime(),
      };

      wx.hideLoading();
      this.stopLoadingTips(); // 停止轮播提示
      this.setData({
        isAnalyzing: false,
        loadingTip: "", // 清空提示
      });

      // 如果是违法内容，显示拒绝消息
      if (analysis.isIllegalContent === true) {
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

      // 如果是非情绪内容，在页面上显示友善提醒
      if (analysis.isNonEmotionContent === true) {
        this.setData({
          showReminder: true,
          reminderMessage:
            analysis.reminderMessage ||
            "这里是情绪记录本，一个专门提供情绪支持的空间。如果你有情绪困扰或需要倾诉，我很愿意倾听。",
        });
        return;
      }

      // 如果不是情绪问题，在页面上显示友好提示
      if (analysis.isEmotionIssue === false) {
        this.setData({
          showReminder: true,
          reminderMessage:
            analysis.friendlyMessage ||
            "你好！这里是情绪记录本，如果你有什么情绪困扰，可以随时告诉我。",
        });
        return;
      }

      // 如果是情绪问题，隐藏提醒
      this.setData({
        showReminder: false,
        reminderMessage: "",
      });

      // 跳转到解析页
      wx.navigateTo({
        url: "/pages/analysis/analysis",
      });
    } catch (error) {
      console.error("情绪分析失败:", error);
      wx.hideLoading();
      this.stopLoadingTips(); // 停止轮播提示
      this.setData({ isAnalyzing: false, loadingTip: "" });

      // 显示详细错误信息
      const errorMsg = error.message || "未知错误";
      console.error("大模型调用失败详情:", errorMsg);
      console.error("完整错误对象:", error);

      // 显示错误提示
      let modalContent = errorMsg;
      if (
        errorMsg.includes("域名未配置") ||
        errorMsg.includes("不在以下 request 合法域名列表中")
      ) {
        modalContent =
          "真机需要配置合法域名\n\n解决方法：\n1. 登录微信公众平台\n2. 开发 → 开发管理 → 开发设置\n3. 在request合法域名中添加：\ndashscope.aliyuncs.com\n\n或使用云开发方式（无需配置域名）";
      }

      wx.showModal({
        title: "大模型调用失败",
        content: modalContent,
        showCancel: true,
        cancelText: "使用本地分析",
        confirmText: "知道了",
        success: (res) => {
          if (res.cancel) {
            // 降级到本地分析
            const analysis = this.analyzeEmotion(text);
            const app = getApp();
            app.globalData.currentEmotion = {
              text: text,
              analysis: analysis,
              timestamp: new Date().getTime(),
            };

            setTimeout(() => {
              wx.navigateTo({
                url: "/pages/analysis/analysis",
              });
            }, 300);
          }
        },
      });
      return;

      const analysis = this.analyzeEmotion(text);
      const app = getApp();
      app.globalData.currentEmotion = {
        text: text,
        analysis: analysis,
        timestamp: new Date().getTime(),
      };

      setTimeout(() => {
        wx.navigateTo({
          url: "/pages/analysis/analysis",
        });
      }, 500);
    }
  },

  // 简单的情感分析逻辑（模拟）
  analyzeEmotion(text) {
    const emotions = [];
    const reasons = [];
    const lowerText = text.toLowerCase();

    // 简单的关键词匹配（实际应该使用更复杂的NLP）
    // 疲惫相关
    if (
      lowerText.includes("累") ||
      lowerText.includes("疲惫") ||
      lowerText.includes("困") ||
      lowerText.includes("倦") ||
      lowerText.includes("乏") ||
      lowerText.includes("疲惫不堪")
    ) {
      emotions.push({ emoji: "😔", label: "疲惫" });
      reasons.push("你可能最近承担了太多，身体和情绪都在提醒你需要休息");
    }

    // 无力感相关
    if (
      lowerText.includes("无力") ||
      lowerText.includes("做不到") ||
      lowerText.includes("没办法") ||
      lowerText.includes("无助") ||
      lowerText.includes("无能为力") ||
      lowerText.includes("不知道怎么办")
    ) {
      emotions.push({ emoji: "😞", label: "无力感" });
      reasons.push("当事情超出我们的控制范围时，感到无力是很正常的反应");
    }

    // 难过相关
    if (
      lowerText.includes("难过") ||
      lowerText.includes("伤心") ||
      lowerText.includes("哭") ||
      lowerText.includes("悲伤") ||
      lowerText.includes("痛苦") ||
      lowerText.includes("难受")
    ) {
      emotions.push({ emoji: "😢", label: "难过" });
      reasons.push("你的感受是真实的，允许自己难过是自我关怀的表现");
    }

    // 焦虑相关
    if (
      lowerText.includes("焦虑") ||
      lowerText.includes("担心") ||
      lowerText.includes("害怕") ||
      lowerText.includes("紧张") ||
      lowerText.includes("不安") ||
      lowerText.includes("恐慌")
    ) {
      emotions.push({ emoji: "😰", label: "焦虑" });
      reasons.push("焦虑往往来自于对未来的不确定，这是大脑在试图保护你");
    }

    // 孤独相关
    if (
      lowerText.includes("孤独") ||
      lowerText.includes("一个人") ||
      lowerText.includes("没人") ||
      lowerText.includes("孤单") ||
      lowerText.includes("孤立") ||
      lowerText.includes("不被理解")
    ) {
      emotions.push({ emoji: "😔", label: "孤独" });
      reasons.push("感到孤独并不意味着你真的孤单，只是此刻需要被理解");
    }

    // 愤怒相关
    if (
      lowerText.includes("生气") ||
      lowerText.includes("愤怒") ||
      lowerText.includes("气") ||
      lowerText.includes("烦躁") ||
      lowerText.includes("恼火") ||
      lowerText.includes("不满")
    ) {
      emotions.push({ emoji: "😠", label: "愤怒" });
      reasons.push("愤怒背后往往隐藏着未被满足的需求，你的感受是合理的");
    }

    // 失望相关
    if (
      lowerText.includes("失望") ||
      lowerText.includes("失落") ||
      lowerText.includes("沮丧") ||
      lowerText.includes("挫败") ||
      lowerText.includes("绝望")
    ) {
      emotions.push({ emoji: "😞", label: "失望" });
      reasons.push("失望来自于期望与现实的差距，这并不意味着你做错了什么");
    }

    // 去重情绪标签
    const uniqueEmotions = [];
    const seenLabels = new Set();
    emotions.forEach((emotion) => {
      if (!seenLabels.has(emotion.label)) {
        seenLabels.add(emotion.label);
        uniqueEmotions.push(emotion);
      }
    });

    // 限制最多3个情绪标签
    const finalEmotions = uniqueEmotions.slice(0, 3);

    // 默认情况
    if (finalEmotions.length === 0) {
      finalEmotions.push({ emoji: "😔", label: "疲惫" });
      reasons.push("你正在经历一段不容易的时光，这本身就需要很大的勇气");
    }

    // 确保至少有2-3条原因解释
    if (reasons.length === 0) {
      reasons.push("你的感受是值得被看见的，不需要为有这样的情绪而自责");
    }
    if (reasons.length === 1) {
      reasons.push("情绪没有对错，它们只是你内心状态的信号");
    }

    // 限制原因数量为2-3条
    const finalReasons = reasons.slice(0, 3);

    return {
      emotions: finalEmotions,
      reasons: finalReasons,
    };
  },
});
