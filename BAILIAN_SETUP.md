# 百炼平台（通义千问）接入指南

## 📍 配置位置

### 方式一：使用云开发（推荐）⭐

**配置位置**：`cloudfunctions/emotionAnalysis/index.js`

找到第 22 行，填入你的 API Key：

```javascript
const LLM_CONFIG = {
  provider: 'qwen',
  apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  apiKey: 'sk-xxxxxxxxxxxxx', // ⬅️ 在这里填入你的百炼平台API Key
  model: 'qwen-turbo',
  temperature: 0.7,
  maxTokens: 1000
}
```

**配置步骤**：

1. ✅ 打开文件 `cloudfunctions/emotionAnalysis/index.js`
2. ✅ 找到 `apiKey: ''` 这一行（第 22 行）
3. ✅ 在引号内填入你的百炼平台 API Key
4. ✅ 保存文件
5. ✅ 在微信开发者工具中，右键 `cloudfunctions/emotionAnalysis` 文件夹
6. ✅ 选择 **"上传并部署：云端安装依赖"**
7. ✅ 等待部署完成

**还需要配置**：

确保 `utils/config.js` 中已配置云开发环境ID：

```javascript
llmMode: 'cloud',
enableLLM: true,
cloud: {
  env: 'your-cloud-env-id', // ⬅️ 填入你的云开发环境ID
  functionName: 'emotionAnalysis'
}
```

确保 `app.js` 中已初始化云开发：

```javascript
wx.cloud.init({
  env: 'your-cloud-env-id', // ⬅️ 填入你的云开发环境ID
  traceUser: true,
})
```

---

### 方式二：直接API调用（不推荐，需要配置域名）

**配置位置**：`utils/config.js`

找到第 23-26 行，修改配置：

```javascript
llmMode: 'direct', // ⬅️ 改为 'direct'
enableLLM: true,
directAPI: {
  apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  apiKey: 'sk-xxxxxxxxxxxxx', // ⬅️ 在这里填入你的百炼平台API Key
}
```

**⚠️ 注意**：
- 需要在小程序后台配置合法域名：`dashscope.aliyuncs.com`
- API Key 会暴露在前端代码中（不安全）
- 不推荐生产环境使用

---

## 🔑 获取百炼平台 API Key

1. 访问 [百炼平台](https://bailian.console.aliyun.com/)
2. 登录你的阿里云账号
3. 进入 **API-KEY管理**
4. 创建或查看你的 API Key
5. 复制 API Key（格式类似：`sk-xxxxxxxxxxxxx`）

---

## ✅ 验证配置

配置完成后，测试步骤：

1. 在小程序中输入情绪文本，例如："最近感觉很累，工作压力很大"
2. 点击"我说完了"按钮
3. 查看是否成功调用大模型进行分析
4. 如果失败，查看控制台错误信息

---

## 🎯 推荐配置

**推荐使用云开发方式**，因为：
- ✅ API Key 存储在云端，更安全
- ✅ 不需要配置合法域名
- ✅ 适合生产环境

**配置清单**：

- [ ] 在 `cloudfunctions/emotionAnalysis/index.js` 中填入 API Key
- [ ] 在 `utils/config.js` 中配置云开发环境ID
- [ ] 在 `app.js` 中初始化云开发
- [ ] 部署云函数
- [ ] 测试功能

---

## 🐛 常见问题

### Q: API Key 格式是什么？
A: 百炼平台的 API Key 格式通常是 `sk-` 开头的字符串

### Q: 如何选择模型？
A: 在 `cloudfunctions/emotionAnalysis/index.js` 中修改 `model` 字段：
- `qwen-turbo` - 快速响应，适合实时场景
- `qwen-plus` - 平衡性能和效果
- `qwen-max` - 最强性能，但响应较慢

### Q: 部署云函数后还是失败？
A: 检查：
1. API Key 是否正确
2. 云开发环境ID是否正确
3. 查看云函数日志排查错误
4. 确认网络连接正常

---

## 📝 快速配置检查清单

- [ ] 已获取百炼平台 API Key
- [ ] 已在云函数中填入 API Key
- [ ] 已配置云开发环境ID
- [ ] 已部署云函数
- [ ] 已测试功能

完成以上步骤后，大模型就可以正常工作了！

