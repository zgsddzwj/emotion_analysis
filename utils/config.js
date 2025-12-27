/**
 * 配置文件
 * 请根据你的实际情况修改配置
 *
 * ⚠️ 安全提示：
 * - 敏感信息（如 API Key）请放在 config.local.js 中
 * - config.local.js 不会被提交到 Git
 * - 如果使用云开发模式，建议在云函数中使用环境变量
 */

// 尝试加载本地配置文件（如果存在）
let localConfig = {};
try {
  // config.local.js 不会被提交到 Git，用于存储敏感信息
  localConfig = require("./config.local.js");
} catch (e) {
  // config.local.js 不存在时忽略错误
  console.log("未找到 config.local.js，使用默认配置");
}

// 默认配置
const defaultConfig = {
  // 大模型接入方式
  // 'cloud' - 微信云开发（推荐）
  // 'direct' - 直接API调用（需要配置合法域名）
  // 'proxy' - 后端代理
  llmMode: "direct",

  // 是否启用大模型（false时使用本地关键词匹配）
  enableLLM: true,

  // 云开发配置
  cloud: {
    env: "your-cloud-env-id", // 云开发环境ID
    functionName: "emotionAnalysis",
  },

  // 直接API配置（需要在小程序后台配置合法域名）
  // ⚠️ 注意：API Key 会暴露在前端代码中，不推荐生产环境使用
  directAPI: {
    // DeepSeek API
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    apiKey: "", // 从 config.local.js 或环境变量读取

    // 通义千问示例
    // apiUrl:
    //   "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    // apiKey: "",

    // OpenAI示例（需要代理）
    // apiUrl: 'https://api.openai.com/v1/chat/completions',
    // apiKey: '',

    // 其他大模型API...
  },

  // 后端代理配置
  proxyAPI: {
    apiUrl: "https://your-backend.com/api/emotion-analysis",
  },

  // 模型配置
  model: {
    provider: "openai", // 'qwen' | 'openai' | 'custom' (DeepSeek使用OpenAI兼容格式)
    modelName: "deepseek-chat",
    temperature: 0.9, // 提高温度值，增加生成内容的多样性和随机性
    maxTokens: 1500, // 增加最大token数，允许更详细的生成
  },
};

// 合并本地配置和默认配置
const config = {
  ...defaultConfig,
  ...localConfig,
  // 深度合并嵌套对象
  cloud: {
    ...defaultConfig.cloud,
    ...(localConfig.cloud || {}),
  },
  directAPI: {
    ...defaultConfig.directAPI,
    ...(localConfig.directAPI || {}),
  },
  proxyAPI: {
    ...defaultConfig.proxyAPI,
    ...(localConfig.proxyAPI || {}),
  },
  model: {
    ...defaultConfig.model,
    ...(localConfig.model || {}),
  },
};

module.exports = config;
