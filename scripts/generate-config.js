#!/usr/bin/env node

/**
 * 从 .env 文件生成 config.local.js
 * 
 * 使用方法：
 * node scripts/generate-config.js
 * 
 * 注意：此脚本需要安装 dotenv 包
 * npm install dotenv --save-dev
 */

const fs = require('fs');
const path = require('path');

// 检查是否安装了 dotenv
let dotenv;
try {
  dotenv = require('dotenv');
} catch (e) {
  console.error('❌ 错误：未安装 dotenv 包');
  console.log('请运行：npm install dotenv --save-dev');
  process.exit(1);
}

// 加载 .env 文件
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ 错误：未找到 .env 文件');
  console.log('请先创建 .env 文件：cp .env.example .env');
  process.exit(1);
}

const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
  console.error('❌ 错误：无法读取 .env 文件', envConfig.error);
  process.exit(1);
}

// 生成 config.local.js 内容
const configContent = `/**
 * 本地配置文件（自动生成）
 * 此文件由 scripts/generate-config.js 从 .env 文件生成
 * ⚠️ 不要手动编辑此文件，修改 .env 后重新运行生成脚本
 * 
 * 生成时间：${new Date().toISOString()}
 */

module.exports = {
  // 云开发配置
  cloud: {
    env: "${process.env.CLOUD_ENV_ID || 'your-cloud-env-id'}",
  },

  // 直接API配置
  directAPI: {
    apiUrl: "${process.env.DEEPSEEK_API_URL || process.env.QWEN_API_URL || process.env.OPENAI_API_URL || 'https://api.deepseek.com/v1/chat/completions'}",
    apiKey: "${process.env.DEEPSEEK_API_KEY || process.env.QWEN_API_KEY || process.env.OPENAI_API_KEY || ''}",
  },

  // 模型配置
  model: {
    provider: "${process.env.MODEL_PROVIDER || 'openai'}",
    modelName: "${process.env.MODEL_NAME || 'deepseek-chat'}",
    temperature: ${parseFloat(process.env.MODEL_TEMPERATURE || '0.9')},
    maxTokens: ${parseInt(process.env.MODEL_MAX_TOKENS || '1500')},
  },
};
`;

// 写入 config.local.js
const configPath = path.join(__dirname, '..', 'utils', 'config.local.js');
fs.writeFileSync(configPath, configContent, 'utf8');

console.log('✅ 成功生成 config.local.js');
console.log(`   路径：${configPath}`);
console.log('\n⚠️  注意：');
console.log('   - 如果使用云开发模式，建议在云开发控制台配置环境变量');
console.log('   - 如果使用 direct 模式，API Key 会暴露在前端代码中');

