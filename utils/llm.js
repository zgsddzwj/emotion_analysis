/**
 * 大模型API调用工具
 * 支持多种接入方式：微信云开发、直接API调用、后端代理
 */

// 从配置文件读取配置
const appConfig = require("./config");

// 配置信息（从 config.js 读取）
const CONFIG = {
  // 接入方式：'cloud' | 'direct' | 'proxy'
  mode: appConfig.llmMode || "cloud",

  // 云开发配置（mode === 'cloud' 时使用）
  cloud: {
    functionName: appConfig.cloud?.functionName || "emotionAnalysis",
  },

  // 直接API配置（mode === 'direct' 时使用，需要配置合法域名）
  direct: {
    apiUrl:
      appConfig.directAPI?.apiUrl ||
      "https://api.deepseek.com/v1/chat/completions",
    apiKey: appConfig.directAPI?.apiKey || "", // 从 config.js 或 config.local.js 读取
  },

  // 后端代理配置（mode === 'proxy' 时使用）
  proxy: {
    apiUrl:
      appConfig.proxyAPI?.apiUrl ||
      "https://your-backend.com/api/emotion-analysis",
  },

  // 模型配置
  model: {
    provider: appConfig.model?.provider || "openai",
    modelName: appConfig.model?.modelName || "deepseek-chat",
    temperature: appConfig.model?.temperature || 0.7,
    maxTokens: appConfig.model?.maxTokens || 1000,
  },
};

/**
 * 调用大模型进行情绪分析
 * @param {string} userText - 用户输入的情绪文本
 * @param {Function} onProgress - 进度回调函数，用于流式输出提示
 * @returns {Promise<Object>} 情绪分析结果
 */
function analyzeEmotionWithLLM(userText, onProgress) {
  return new Promise((resolve, reject) => {
    if (!userText || !userText.trim()) {
      reject(new Error("输入文本不能为空"));
      return;
    }

    switch (CONFIG.mode) {
      case "cloud":
        callCloudFunction(userText, onProgress).then(resolve).catch(reject);
        break;
      case "direct":
        callDirectAPI(userText, onProgress).then(resolve).catch(reject);
        break;
      case "proxy":
        callProxyAPI(userText, onProgress).then(resolve).catch(reject);
        break;
      default:
        reject(new Error("未配置接入方式"));
    }
  });
}

/**
 * 通过云函数调用大模型
 * @param {string} userText - 用户输入文本
 * @param {Function} onProgress - 进度回调函数
 */
function callCloudFunction(userText, onProgress) {
  return new Promise((resolve, reject) => {
    // 发送进度提示（模拟流式输出体验）
    const progressTips = [
      { delay: 0, tip: "正在连接云服务..." },
      { delay: 300, tip: "正在理解你的感受..." },
      { delay: 800, tip: "我在认真倾听..." },
      { delay: 1300, tip: "你的情绪值得被看见..." },
      { delay: 1800, tip: "让我为你整理一下..." },
      { delay: 2300, tip: "我在为你准备回应..." },
      { delay: 2800, tip: "你的感受很重要..." },
      { delay: 3300, tip: "我在仔细思考..." },
      { delay: 3800, tip: "让我为你找到合适的建议..." },
      { delay: 4300, tip: "你的情绪正在被理解..." },
      { delay: 4800, tip: "我在为你准备温暖的回应..." },
      { delay: 5300, tip: "你的每一句话都很重要..." },
      { delay: 5800, tip: "让我为你整理情绪..." },
      { delay: 6300, tip: "我在认真分析..." },
      { delay: 6800, tip: "你的感受正在被看见..." },
      { delay: 7300, tip: "让我为你准备一些建议..." },
      { delay: 7800, tip: "我在为你思考..." },
      { delay: 8300, tip: "你的情绪值得被认真对待..." },
    ];

    if (onProgress) {
      progressTips.forEach(({ delay, tip }) => {
        setTimeout(() => {
          if (onProgress) {
            onProgress(tip);
          }
        }, delay);
      });
    }

    wx.cloud.callFunction({
      name: CONFIG.cloud.functionName,
      data: {
        text: userText,
        model: CONFIG.model,
      },
      success: (res) => {
        // 发送进度提示
        if (onProgress) {
          onProgress("正在处理响应...");
          setTimeout(() => {
            if (onProgress) onProgress("正在解析结果...");
          }, 200);
        }
        if (res.result && res.result.success) {
          const result = parseLLMResponse(res.result.data);
          // 发送完成提示
          if (onProgress) {
            setTimeout(() => {
              if (onProgress) onProgress("完成了！");
            }, 300);
          }
          resolve(result);
        } else {
          reject(new Error(res.result?.error || "云函数调用失败"));
        }
      },
      fail: (err) => {
        console.error("云函数调用失败:", err);
        let errorMsg = "云函数调用失败";

        // 提供更详细的错误信息
        if (err.errMsg) {
          if (err.errMsg.includes("function not found")) {
            errorMsg = "云函数未部署，请先部署云函数";
          } else if (err.errMsg.includes("cloud init")) {
            errorMsg = "云开发未初始化，请检查云开发环境ID配置";
          } else if (err.errMsg.includes("network")) {
            errorMsg = "网络请求失败，请检查网络连接";
          } else {
            errorMsg = `云函数调用失败: ${err.errMsg}`;
          }
        }

        reject(new Error(errorMsg));
      },
    });
  });
}

/**
 * 直接调用API（需要配置合法域名）
 * @param {string} userText - 用户输入文本
 * @param {Function} onProgress - 进度回调函数
 */
function callDirectAPI(userText, onProgress) {
  return new Promise((resolve, reject) => {
    // 检查 API Key 是否配置
    if (!CONFIG.direct.apiKey || CONFIG.direct.apiKey.trim() === "") {
      const errorMsg =
        "API Key 未配置！\n\n" +
        "请按以下步骤配置：\n" +
        "1. 复制配置文件：cp utils/config.local.js.example utils/config.local.js\n" +
        "2. 编辑 utils/config.local.js，填入你的 API Key\n" +
        "3. 或者使用云开发模式（推荐）";
      console.error("❌", errorMsg);
      reject(new Error(errorMsg));
      return;
    }

    const prompt = buildPrompt(userText);

    // 根据provider选择不同的请求格式
    let requestData;
    let headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.direct.apiKey}`,
    };

    // 调试信息（不输出完整 API Key）
    console.log(
      "🔑 API Key 已配置:",
      CONFIG.direct.apiKey.substring(0, 10) + "..."
    );
    console.log("🌐 API URL:", CONFIG.direct.apiUrl);

    if (CONFIG.model.provider === "qwen") {
      // 通义千问格式
      requestData = {
        model: CONFIG.model.modelName,
        input: {
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        parameters: {
          temperature: CONFIG.model.temperature,
          max_tokens: CONFIG.model.maxTokens,
        },
      };
      headers["X-DashScope-SSE"] = "disable";
    } else {
      // OpenAI/DeepSeek格式
      // 注意：小程序不支持 SSE 流式输出，所以不使用 stream: true
      // 但会通过进度回调提供友好的等待体验
      requestData = {
        model: CONFIG.model.modelName,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: CONFIG.model.temperature,
        max_tokens: CONFIG.model.maxTokens,
        stream: false, // 小程序不支持 SSE，使用非流式
      };
    }

    // 发送进度提示（模拟流式输出体验）
    const progressTips = [
      { delay: 0, tip: "正在连接服务器..." },
      { delay: 300, tip: "正在理解你的感受..." },
      { delay: 800, tip: "我在认真倾听..." },
      { delay: 1300, tip: "你的情绪值得被看见..." },
      { delay: 1800, tip: "让我为你整理一下..." },
      { delay: 2300, tip: "我在为你准备回应..." },
      { delay: 2800, tip: "你的感受很重要..." },
      { delay: 3300, tip: "我在仔细思考..." },
      { delay: 3800, tip: "让我为你找到合适的建议..." },
      { delay: 4300, tip: "你的情绪正在被理解..." },
      { delay: 4800, tip: "我在为你准备温暖的回应..." },
      { delay: 5300, tip: "你的每一句话都很重要..." },
      { delay: 5800, tip: "让我为你整理情绪..." },
      { delay: 6300, tip: "我在认真分析..." },
      { delay: 6800, tip: "你的感受正在被看见..." },
      { delay: 7300, tip: "让我为你准备一些建议..." },
      { delay: 7800, tip: "我在为你思考..." },
      { delay: 8300, tip: "你的情绪值得被认真对待..." },
    ];

    if (onProgress) {
      progressTips.forEach(({ delay, tip }) => {
        setTimeout(() => {
          if (onProgress) {
            onProgress(tip);
          }
        }, delay);
      });
    }

    wx.request({
      url: CONFIG.direct.apiUrl,
      method: "POST",
      header: headers,
      data: requestData,
      success: (res) => {
        console.log("📡 API响应状态码:", res.statusCode);

        // 发送进度提示
        if (onProgress) {
          onProgress("正在处理响应...");
        }

        if (res.statusCode === 200 && res.data) {
          if (res.data.code) {
            reject(new Error(res.data.message || `API错误: ${res.data.code}`));
            return;
          }
          try {
            // 发送进度提示
            if (onProgress) {
              onProgress("正在处理响应...");
              setTimeout(() => {
                if (onProgress) onProgress("正在解析结果...");
              }, 200);
            }

            const result = parseDirectAPIResponse(res.data);
            console.log(
              "✅ 解析成功，返回结果:",
              JSON.stringify(result, null, 2)
            );

            // 发送完成提示
            if (onProgress) {
              setTimeout(() => {
                if (onProgress) onProgress("完成了！");
              }, 300);
            }

            resolve(result);
          } catch (error) {
            console.error("❌ 解析响应失败:", error);
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        } else if (res.statusCode === 401) {
          // 401 认证失败，提供详细的错误信息
          const errorMsg =
            "API 认证失败（HTTP 401）\n\n" +
            "可能的原因：\n" +
            "1. API Key 无效或已过期\n" +
            "2. API Key 格式错误\n" +
            "3. API Key 未正确配置\n\n" +
            "请检查：\n" +
            "- utils/config.local.js 中的 apiKey 是否正确\n" +
            "- API Key 是否有效（可在对应平台测试）\n" +
            "- 是否使用了正确的 API Key（DeepSeek/通义千问等）";
          console.error("❌", errorMsg);
          reject(new Error(errorMsg));
        } else {
          const errorMsg =
            res.data?.message ||
            res.data?.error?.message ||
            `HTTP ${res.statusCode}`;
          reject(new Error(`API调用失败: ${errorMsg}`));
        }
      },
      fail: (err) => {
        console.error("API调用失败:", err);
        let errorMsg = "网络请求失败";
        if (err.errMsg) {
          if (
            err.errMsg.includes("url not in domain list") ||
            err.errMsg.includes("不在以下 request 合法域名列表中")
          ) {
            const domain =
              CONFIG.model.provider === "qwen"
                ? "dashscope.aliyuncs.com"
                : "api.deepseek.com";
            errorMsg = `域名未配置：请在小程序后台配置合法域名 ${domain}，或使用云开发方式`;
          } else if (err.errMsg.includes("fail")) {
            errorMsg = `请求失败: ${err.errMsg}，请检查网络连接`;
          } else {
            errorMsg = `请求失败: ${err.errMsg}`;
          }
        }
        reject(new Error(errorMsg));
      },
    });
  });
}

/**
 * 通过后端代理调用API
 * @param {string} userText - 用户输入文本
 * @param {Function} onProgress - 进度回调函数
 */
function callProxyAPI(userText, onProgress) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: CONFIG.proxy.apiUrl,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
      data: {
        text: userText,
        model: CONFIG.model,
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success) {
          resolve(parseLLMResponse(res.data.data));
        } else {
          reject(new Error(res.data?.error || "API调用失败"));
        }
      },
      fail: (err) => {
        console.error("代理API调用失败:", err);
        reject(new Error("网络请求失败，请检查网络连接"));
      },
    });
  });
}

/**
 * 构建提示词
 */
function buildPrompt(userText) {
  return `你是一位专业的情绪支持助手，擅长共情和理解。请判断用户的输入是否包含情绪困扰或需要情绪支持的内容。

用户输入：${userText}

判断规则（按优先级）：
1. **违法内容检测**：如果用户输入涉及违法、犯罪、暴力、伤害他人等内容（如杀人、犯罪、暴力行为等），设置 "isIllegalContent": true，并返回拒绝消息
2. **非情绪内容检测**：如果用户只是普通问候、闲聊、询问功能、技术问题、无关话题等，没有情绪困扰，设置 "isNonEmotionContent": true，并返回友善提醒
3. **情绪问题**：如果用户表达了情绪困扰、压力、难过、焦虑等，设置 "isEmotionIssue": true

请按照以下JSON格式返回分析结果：

情况1：如果是违法内容（isIllegalContent: true）：
{
  "isIllegalContent": true,
  "rejectionMessage": "友善但坚定的拒绝消息，例如：我理解你可能正在经历困难，但这里只能提供情绪支持。如果你有违法或伤害他人的想法，建议你寻求专业帮助或联系相关机构。"
}

情况2：如果是非情绪内容（isNonEmotionContent: true）：
{
  "isNonEmotionContent": true,
  "reminderMessage": "友善的提醒消息，例如：这里是情绪记录本，一个专门提供情绪支持的空间。如果你有情绪困扰或需要倾诉，我很愿意倾听。"
}

情况3：如果是情绪问题（isEmotionIssue: true）：
{
  "isEmotionIssue": true,
  "emotions": [
    {"emoji": "😔", "label": "疲惫"},
    {"emoji": "😞", "label": "无力感"}
  ],
  "reasons": [
    "可能的原因1",
    "可能的原因2",
    "可能的原因3"
  ],
  "clarification": "个性化的非自责澄清",
  "actions": [
    {"emoji": "🌿", "text": "具体的微行动建议1"},
    {"emoji": "✍️", "text": "具体的微行动建议2"},
    {"emoji": "💚", "text": "具体的微行动建议3"}
  ],
  "comfortText": "个性化的安抚性开场语"
}

重要要求：
1. **共情优先**：让用户感觉"被看见"、"被理解"，而不是被分析
2. **个性化表达**：根据用户的具体描述，生成贴合其情境的回应，避免模板化
3. **准确判断**：准确判断是否是情绪问题，不要过度解读普通对话
4. **如果是情绪问题**：
   - emotions数组包含1-3个情绪标签，每个包含emoji和label，要准确反映用户的情绪状态
   - reasons数组包含2-3条可能的原因解释，要温暖、理解、不评判，让用户感觉"原来是这样"。**每次都要根据用户的具体描述生成不同的原因，不要使用固定模板**
   - clarification是一句个性化的非自责澄清，要针对用户的具体情况，让用户感觉"这不是我的错"。**必须根据用户描述的具体情境来写，每次都要不同**
   - actions数组包含3条微行动建议，要具体可执行、贴合用户当下状态，让用户感觉"这个我可以做到"。**这是最重要的部分，必须根据用户的具体情绪、情境、时间（如果是晚上就建议休息相关，如果是早上就建议活动相关）生成完全不同的建议。避免总是使用"深呼吸"、"写下来"等常见建议，要根据用户的具体情况创造性地提出建议。例如：如果用户说工作累，可以建议"今晚允许自己点个外卖，不用做饭"；如果用户说孤独，可以建议"给一个很久没联系的朋友发个消息"；如果用户说焦虑，可以建议"把担心的事情写在一张纸上，然后暂时放在一边"。每次都要生成不同的、贴合情境的建议。**
   - comfortText是一句安抚性开场语，要温暖、共情，让用户感觉"有人理解我"。**每次都要根据用户的具体描述生成不同的开场语，不要使用固定模板**
5. **如果不是情绪问题**：
   - friendlyMessage是一句友好、温暖的回应
6. **禁用语言**：不要使用"你应该"、"别想太多"、"积极一点"、"想开点"等说教性语言
7. **语气要求**：使用温和、理解、陪伴的语气，像朋友一样倾听，而不是像专家一样指导
8. **多样性要求**：**每次生成的内容必须完全不同，即使是相似的情绪，也要根据用户的具体描述生成不同的建议。不要使用任何固定模板或套路。**

只返回JSON，不要其他文字。`;
}

/**
 * 解析大模型返回的响应
 */
function parseLLMResponse(response) {
  try {
    console.log("开始解析LLM响应，原始响应:", response);

    // 如果响应是字符串，尝试解析JSON
    let data = response;
    if (typeof response === "string") {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
        console.log("解析后的JSON数据:", data);
      } else {
        throw new Error("无法解析响应格式");
      }
    }

    // 优先检查违法内容
    if (data.isIllegalContent === true) {
      const rejectionMessage =
        data.rejectionMessage ||
        "我理解你可能正在经历困难，但这里只能提供情绪支持。如果你有违法或伤害他人的想法，建议你寻求专业帮助或联系相关机构。";
      return {
        isIllegalContent: true,
        rejectionMessage: rejectionMessage,
      };
    }

    // 检查非情绪内容
    if (data.isNonEmotionContent === true) {
      const reminderMessage =
        data.reminderMessage ||
        "这里是情绪记录本，一个专门提供情绪支持的空间。如果你有情绪困扰或需要倾诉，我很愿意倾听。";
      return {
        isNonEmotionContent: true,
        reminderMessage: reminderMessage,
      };
    }

    // 判断是否是情绪问题
    const isEmotionIssue = data.isEmotionIssue === true;

    // 如果不是情绪问题，返回友好消息（兼容旧格式）
    if (!isEmotionIssue) {
      const friendlyMessage =
        data.friendlyMessage ||
        "你好！这里是情绪记录本，如果你有什么情绪困扰，可以随时告诉我。";
      return {
        isEmotionIssue: false,
        friendlyMessage: friendlyMessage,
      };
    }

    // 如果是情绪问题，继续解析情绪数据
    if (!data.emotions || !Array.isArray(data.emotions)) {
      throw new Error("响应格式错误：缺少emotions字段");
    }

    // 确保emotions格式正确
    const emotions = data.emotions
      .map((emotion) => ({
        emoji: emotion.emoji || "",
        label: emotion.label || "",
      }))
      .filter((emotion) => emotion.emoji && emotion.label)
      .slice(0, 3); // 最多3个

    if (emotions.length === 0) {
      throw new Error("响应格式错误：emotions格式不正确或为空");
    }

    // 确保reasons格式正确
    const reasons = Array.isArray(data.reasons) ? data.reasons.slice(0, 3) : [];

    // 获取clarification
    const clarification = data.clarification || "";

    // 获取actions
    let actions = [];
    if (Array.isArray(data.actions) && data.actions.length > 0) {
      actions = data.actions
        .map((action) => ({
          emoji: action.emoji || "🌿",
          text: action.text || "",
        }))
        .filter((action) => action.text)
        .slice(0, 3);
      console.log("✅ 成功解析到actions:", actions);
    } else {
      console.warn("⚠️ 未找到actions字段或为空，data.actions:", data.actions);
    }

    // 获取comfortText
    const comfortText = data.comfortText || "";

    const result = {
      isEmotionIssue: true,
      emotions,
      reasons,
      clarification,
      actions,
      comfortText,
    };

    console.log("📦 最终返回的分析结果:", JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error("解析响应失败:", error);
    throw error;
  }
}

/**
 * 解析直接API的响应（适配不同API格式）
 */
function parseDirectAPIResponse(response) {
  console.log(
    "🔍 解析API响应，response结构:",
    JSON.stringify(response, null, 2)
  );

  // 通义千问API响应格式
  if (
    response.output &&
    response.output.choices &&
    response.output.choices[0]
  ) {
    const content = response.output.choices[0].message.content;
    console.log("📝 提取到的content:", content);
    if (!content) {
      throw new Error("API返回内容为空");
    }
    const result = parseLLMResponse(content);
    console.log(
      "✅ parseDirectAPIResponse最终返回:",
      JSON.stringify(result, null, 2)
    );
    return result;
  }

  // 如果直接返回了output.text（某些版本）
  if (response.output && response.output.text) {
    return parseLLMResponse(response.output.text);
  }

  // OpenAI格式
  if (response.choices && response.choices[0]) {
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("API返回内容为空");
    }
    return parseLLMResponse(content);
  }

  // 如果响应本身就是文本
  if (typeof response === "string") {
    return parseLLMResponse(response);
  }

  throw new Error(
    `无法解析API响应格式: ${JSON.stringify(response).substring(0, 200)}`
  );
}

/**
 * 更新配置
 */
function updateConfig(newConfig) {
  Object.assign(CONFIG, newConfig);
}

module.exports = {
  analyzeEmotionWithLLM,
  updateConfig,
  CONFIG,
};
