# 快速配置指南

## 🚀 5分钟快速接入大模型

### 方式一：使用微信云开发（最简单）

#### 1. 开通云开发（1分钟）
- 在微信开发者工具中点击 **云开发** 按钮
- 开通环境，记录环境ID

#### 2. 修改配置（1分钟）
打开 `utils/config.js`，修改：
```javascript
llmMode: 'cloud',
enableLLM: true,
cloud: {
  env: '你的环境ID', // 填入刚才记录的环境ID
  functionName: 'emotionAnalysis'
}
```

打开 `app.js`，修改：
```javascript
wx.cloud.init({
  env: '你的环境ID', // 填入环境ID
  traceUser: true,
})
```

#### 3. 配置API Key（2分钟）
打开 `cloudfunctions/emotionAnalysis/index.js`，修改：
```javascript
const LLM_CONFIG = {
  provider: 'qwen',
  apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  apiKey: '你的API Key', // 从阿里云DashScope获取
  model: 'qwen-turbo',
  temperature: 0.7,
  maxTokens: 1000
}
```

**获取API Key**：
1. 访问 https://dashscope.aliyuncs.com/
2. 注册/登录账号
3. 创建API Key

#### 4. 部署云函数（1分钟）
- 在微信开发者工具中，右键 `cloudfunctions/emotionAnalysis` 文件夹
- 选择 **"上传并部署：云端安装依赖"**
- 等待部署完成

#### 5. 测试
- 在小程序中输入情绪文本
- 点击"我说完了"
- 查看是否成功调用大模型

---

### 方式二：使用后端代理

如果你有自己的后端服务：

1. 修改 `utils/config.js`：
```javascript
llmMode: 'proxy',
enableLLM: true,
proxyAPI: {
  apiUrl: 'https://your-backend.com/api/emotion-analysis'
}
```

2. 确保后端API符合接口规范（见 `LLM_SETUP.md`）

3. 在小程序后台配置合法域名

---

### 方式三：临时禁用大模型

如果想先测试其他功能，可以：
```javascript
// utils/config.js
enableLLM: false  // 使用本地关键词匹配
```

---

## ⚠️ 注意事项

1. **API Key安全**：不要将API Key提交到代码仓库
2. **费用**：大模型API调用会产生费用，注意控制使用量
3. **降级方案**：如果大模型调用失败，会自动降级到本地分析

---

## 🐛 遇到问题？

1. 查看 `LLM_SETUP.md` 详细文档
2. 检查控制台错误信息
3. 查看云函数日志（如果使用云开发）

