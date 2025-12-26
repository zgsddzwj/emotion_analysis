# 大模型接入配置指南

本文档说明如何配置和接入大模型进行情绪分析。

## 📋 支持的接入方式

### 1. 微信云开发（推荐）⭐
- ✅ 无需配置域名
- ✅ 安全性高（API Key在云端）
- ✅ 无需自建服务器
- ❌ 需要开通微信云开发

### 2. 直接API调用
- ✅ 简单直接
- ❌ 需要在小程序后台配置合法域名
- ❌ API Key暴露在前端（不安全）

### 3. 后端代理
- ✅ 安全性高
- ✅ 灵活可控
- ❌ 需要自建后端服务

---

## 🚀 方式一：微信云开发（推荐）

### 步骤1：开通云开发

1. 在微信开发者工具中，点击顶部菜单 **云开发**
2. 开通云开发环境
3. 记录下你的**环境ID**（Environment ID）

### 步骤2：配置云函数

1. 打开 `utils/config.js`，修改配置：
```javascript
llmMode: 'cloud',
enableLLM: true,
cloud: {
  env: 'your-cloud-env-id', // 填入你的环境ID
  functionName: 'emotionAnalysis'
}
```

2. 打开 `app.js`，确保云开发初始化：
```javascript
wx.cloud.init({
  env: 'your-cloud-env-id', // 填入你的环境ID
  traceUser: true,
})
```

### 步骤3：配置大模型API

1. 打开 `cloudfunctions/emotionAnalysis/index.js`
2. 修改 `LLM_CONFIG` 配置：
```javascript
const LLM_CONFIG = {
  provider: 'qwen', // 或 'openai'
  apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  apiKey: 'your-api-key', // 填入你的API Key
  model: 'qwen-turbo',
  temperature: 0.7,
  maxTokens: 1000
}
```

### 步骤4：部署云函数

1. 在微信开发者工具中，右键 `cloudfunctions/emotionAnalysis` 文件夹
2. 选择 **"上传并部署：云端安装依赖"**
3. 等待部署完成

### 步骤5：测试

1. 在小程序中输入情绪文本
2. 点击"我说完了"
3. 查看是否成功调用大模型

---

## 🔧 方式二：直接API调用

### 步骤1：配置合法域名

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **开发** → **开发管理** → **开发设置**
3. 在 **服务器域名** 中添加你的API域名

### 步骤2：配置API

打开 `utils/config.js`，修改配置：
```javascript
llmMode: 'direct',
enableLLM: true,
directAPI: {
  apiUrl: 'https://your-api-domain.com/api/endpoint',
  apiKey: 'your-api-key'
}
```

### 步骤3：修改 `utils/llm.js`

根据你的API格式修改 `callDirectAPI` 函数中的请求参数。

---

## 🌐 方式三：后端代理

### 步骤1：搭建后端服务

你需要搭建一个后端服务，接收小程序请求，然后调用大模型API。

**后端API接口规范**：
- **URL**: `POST /api/emotion-analysis`
- **请求体**:
```json
{
  "text": "用户输入的情绪文本",
  "model": {
    "provider": "qwen",
    "modelName": "qwen-turbo",
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

- **响应体**:
```json
{
  "success": true,
  "data": {
    "emotions": [
      {"emoji": "😔", "label": "疲惫"}
    ],
    "reasons": [
      "可能的原因1",
      "可能的原因2"
    ],
    "clarification": "这不是因为你不努力"
  }
}
```

### 步骤2：配置小程序

打开 `utils/config.js`，修改配置：
```javascript
llmMode: 'proxy',
enableLLM: true,
proxyAPI: {
  apiUrl: 'https://your-backend.com/api/emotion-analysis'
}
```

### 步骤3：配置合法域名

在小程序后台配置你的后端域名。

---

## 🤖 支持的大模型

### 通义千问（推荐国内使用）

1. 访问[阿里云DashScope](https://dashscope.aliyun.com/)
2. 注册账号并创建API Key
3. 在云函数或后端中配置API Key

**API文档**: https://help.aliyun.com/zh/model-studio/

### OpenAI

1. 访问[OpenAI Platform](https://platform.openai.com/)
2. 创建API Key
3. 注意：需要代理才能在国内访问

**API文档**: https://platform.openai.com/docs/api-reference

### 其他大模型

你可以根据API格式修改 `utils/llm.js` 和云函数代码来接入其他大模型。

---

## ⚙️ 配置说明

### `utils/config.js` 配置项

| 配置项 | 说明 | 可选值 |
|--------|------|--------|
| `llmMode` | 接入方式 | `'cloud'` \| `'direct'` \| `'proxy'` |
| `enableLLM` | 是否启用大模型 | `true` \| `false` |
| `model.provider` | 模型提供商 | `'qwen'` \| `'openai'` \| `'custom'` |
| `model.modelName` | 模型名称 | 如 `'qwen-turbo'`, `'gpt-3.5-turbo'` |
| `model.temperature` | 温度参数 | 0-1，越高越随机 |
| `model.maxTokens` | 最大token数 | 建议 500-2000 |

---

## 🔒 安全建议

1. **API Key安全**
   - ✅ 使用云开发时，API Key存储在云函数中
   - ❌ 不要在前端代码中硬编码API Key
   - ✅ 使用环境变量或云开发配置存储敏感信息

2. **请求限制**
   - 建议在后端或云函数中添加请求频率限制
   - 防止API Key被滥用

3. **错误处理**
   - 代码中已包含降级方案（失败时使用本地关键词匹配）
   - 建议添加更详细的错误日志

---

## 🐛 常见问题

### Q1: 云函数调用失败？
- 检查云开发环境是否开通
- 检查环境ID是否正确
- 检查云函数是否部署成功
- 查看云函数日志排查错误

### Q2: API调用返回错误？
- 检查API Key是否正确
- 检查API URL是否正确
- 检查请求格式是否符合API要求
- 查看网络请求日志

### Q3: 如何测试大模型是否接入成功？
- 在 `utils/config.js` 中设置 `enableLLM: true`
- 输入一段情绪文本
- 查看返回的分析结果是否更精准
- 查看控制台是否有错误信息

### Q4: 如何切换回本地分析？
- 在 `utils/config.js` 中设置 `enableLLM: false`
- 或直接注释掉大模型调用代码

---

## 📝 提示词优化

如果你发现大模型返回的结果不够理想，可以修改 `utils/llm.js` 中的 `buildPrompt` 函数来优化提示词。

---

## 🎯 下一步

1. 选择一个接入方式
2. 按照对应步骤配置
3. 测试功能是否正常
4. 根据实际效果调整提示词和参数

如有问题，请查看代码注释或联系开发者。

