# 情绪承接小程序

一个极简、低打扰、高安全感的情绪支持小程序。通过大模型（DeepSeek/通义千问等）进行情绪分析，为用户提供情绪支持和微行动建议。

## ✨ 功能特点

- 🎯 **极简设计**：3步内完成主流程
- 💚 **高安全感**：不评判、不记录隐私、不说教
- 🌿 **情绪承接**：让用户感到被看见、被理解
- 📝 **微行动建议**：提供可落地的情绪调节建议
- 🤖 **AI 情绪分析**：基于大模型的智能情绪识别和分析

## 📱 页面结构

1. **启动页** (`pages/splash`) - 建立安全感，降低心理防御
2. **首页** (`pages/index`) - 情绪输入，让用户愿意说出来
3. **情绪解析页** (`pages/analysis`) - 情绪标签、来源解释、非自责澄清
4. **微行动建议页** (`pages/action`) - 提供今天就能完成的指引
5. **情绪记录页** (`pages/history`) - 查看历史记录和情绪趋势

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/zgsddzwj/emotion_analysis.git
cd emotion_analysis
```

### 2. 配置环境变量

#### 方式一：使用云开发（推荐）⭐

1. **创建 `.env` 文件**：

   ```bash
   cp .env.example .env
   ```

2. **编辑 `.env` 文件**，填入你的配置：

   ```bash
   DEEPSEEK_API_KEY=sk-your-actual-api-key-here
   CLOUD_ENV_ID=your-cloud-env-id
   MODEL_PROVIDER=openai
   MODEL_NAME=deepseek-chat
   ```

3. **在微信开发者工具中配置云函数环境变量**：
   - 打开微信开发者工具
   - 点击「云开发」按钮，开通云开发环境
   - 进入「云函数」→ `emotionAnalysis` → 「环境变量」
   - 添加以下环境变量：
     - `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key
     - `DEEPSEEK_API_URL`: `https://api.deepseek.com/v1/chat/completions`
     - `MODEL_PROVIDER`: `openai`
     - `MODEL_NAME`: `deepseek-chat`
     - `MODEL_TEMPERATURE`: `0.9`
     - `MODEL_MAX_TOKENS`: `1000`

4. **修改 `utils/config.js`**：

   ```javascript
   llmMode: "cloud",  // 使用云开发模式
   enableLLM: true,
   cloud: {
     env: "your-cloud-env-id",  // 填入你的云开发环境ID
     functionName: "emotionAnalysis",
   },
   ```

5. **修改 `app.js`**，初始化云开发：

   ```javascript
   wx.cloud.init({
     env: "your-cloud-env-id",  // 填入你的云开发环境ID
     traceUser: true,
   });
   ```

6. **部署云函数**：
   - 在微信开发者工具中，右键 `cloudfunctions/emotionAnalysis` 文件夹
   - 选择「上传并部署：云端安装依赖」
   - 等待部署完成

#### 方式二：直接 API 调用（不推荐，仅用于开发测试）

⚠️ **注意**：此方式 API Key 会暴露在前端代码中，不安全。

1. **创建本地配置文件**：

   ```bash
   cp utils/config.local.js.example utils/config.local.js
   ```

2. **编辑 `utils/config.local.js`**，填入 API Key：

   ```javascript
   module.exports = {
     directAPI: {
       apiUrl: "https://api.deepseek.com/v1/chat/completions",
       apiKey: "sk-your-actual-api-key-here",
     },
   };
   ```

3. **修改 `utils/config.js`**：

   ```javascript
   llmMode: "direct",  // 使用直接 API 调用
   enableLLM: true,
   ```

4. **在小程序后台配置合法域名**：
   - 登录[微信公众平台](https://mp.weixin.qq.com/)
   - 进入「开发」→「开发管理」→「开发设置」
   - 在「服务器域名」中添加：`api.deepseek.com`

### 3. 运行项目

1. **使用微信开发者工具打开项目**
2. **配置 AppID**（可使用测试号）
3. **点击「编译」运行**

## 🔑 获取 API Key

### DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册/登录账号
3. 进入 API 管理页面
4. 创建 API Key

### 通义千问 API Key（备用）

1. 访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)
2. 注册/登录账号
3. 创建 API Key

## ⚙️ 配置说明

### 配置文件

- `utils/config.js` - 主配置文件
- `utils/config.local.js` - 本地配置文件（不提交到 Git，用于存储敏感信息）
- `.env` - 环境变量文件（不提交到 Git）
- `.env.example` - 环境变量模板

### 配置项说明

| 配置项 | 说明 | 可选值 |
| :----- | :--- | :----- |
| `llmMode` | 接入方式 | `'cloud'` \| `'direct'` \| `'proxy'` |
| `enableLLM` | 是否启用大模型 | `true` \| `false` |
| `model.provider` | 模型提供商 | `'openai'` (DeepSeek) \| `'qwen'` (通义千问) |
| `model.modelName` | 模型名称 | `'deepseek-chat'` \| `'qwen-turbo'` 等 |

## 🔒 安全提示

- ⚠️ **不要**将 `.env` 文件提交到 Git
- ⚠️ **不要**将 `config.local.js` 文件提交到 Git
- ✅ **推荐使用云开发模式**：API Key 存储在云端，更安全
- ✅ 将 `.env.example` 和 `config.local.js.example` 提交到 Git，作为配置模板

## 📦 项目结构

```text
emotion_analysis/
├── pages/              # 页面文件
│   ├── splash/        # 启动页
│   ├── index/         # 首页
│   ├── analysis/      # 情绪解析页
│   ├── action/        # 微行动建议页
│   ├── history/       # 历史记录页
│   └── ...
├── cloudfunctions/    # 云函数
│   └── emotionAnalysis/  # 情绪分析云函数
├── utils/             # 工具函数
│   ├── config.js      # 配置文件
│   └── llm.js         # 大模型调用工具
├── .env.example       # 环境变量模板
└── README.md          # 项目说明
```

## 🛠️ 技术栈

- **框架**：微信小程序原生框架
- **云服务**：微信云开发（可选）
- **AI 模型**：DeepSeek / 通义千问 / OpenAI 等
- **数据存储**：本地存储（localStorage）

## 📝 注意事项

- 当前版本数据存储在本地，刷新后会丢失
- 生产环境建议接入后端服务和数据库
- 大模型 API 调用会产生费用，注意控制使用量
- 如果大模型调用失败，会自动降级到本地关键词匹配

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
