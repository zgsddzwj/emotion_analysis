/**
 * 配置文件
 * 请根据你的实际情况修改配置
 */

module.exports = {
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
  directAPI: {
    // 通义千问示例
    apiUrl:
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    apiKey: "sk-1b9f583964144fe1973bd6eed4082b51", // 请填入你的API Key

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
    provider: "qwen", // 'qwen' | 'openai' | 'custom'
    modelName: "qwen-turbo",
    temperature: 0.9, // 提高温度值，增加生成内容的多样性和随机性
    maxTokens: 1500, // 增加最大token数，允许更详细的生成
  },
};
