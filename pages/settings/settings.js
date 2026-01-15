Page({
  data: {
    vibrationEnabled: true,
    animationEnabled: true,
  },

  onLoad() {
    const vibration = wx.getStorageSync("setting_vibration");
    const animation = wx.getStorageSync("setting_animation");
    this.setData({
      vibrationEnabled: vibration !== "" ? !!vibration : true,
      animationEnabled: animation !== "" ? !!animation : true,
    });
  },

  toggleVibration(e) {
    const value = e.detail.value;
    wx.setStorageSync("setting_vibration", value);
    this.setData({ vibrationEnabled: value });
  },

  toggleAnimation(e) {
    const value = e.detail.value;
    wx.setStorageSync("setting_animation", value);
    this.setData({ animationEnabled: value });
  },

  clearLocal() {
    wx.showModal({
      title: "清空本地记录",
      content: "确定要清空所有本地情绪记录吗？此操作不可恢复。",
      confirmText: "清空",
      confirmColor: "#d24d4d",
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync("emotionHistory");
          const app = getApp();
          app.globalData.emotionHistory = [];
          wx.showToast({ title: "已清空", icon: "none" });
        }
      },
    });
  },

  copyEmail() {
    wx.setClipboardData({
      data: "sswj@163.com",
      success: () => {
        wx.showToast({ title: "已复制邮箱", icon: "success" });
      },
    });
  },
});
