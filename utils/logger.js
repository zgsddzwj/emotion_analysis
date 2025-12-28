/**
 * 日志工具
 * 生产环境自动禁用调试日志
 */

// 判断是否为生产环境
// 可以通过编译条件或配置来控制
const isProduction = false; // 上线前改为 true

const logger = {
  log: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },

  warn: (...args) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },

  error: (...args) => {
    // 错误日志始终输出，便于生产环境排查问题
    console.error(...args);
  },

  info: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },

  debug: (...args) => {
    if (!isProduction) {
      console.log("[DEBUG]", ...args);
    }
  },
};

module.exports = logger;
