/**
 * 大模型API调用工具
 * 支持多种接入方式：微信云开发、直接API调用、后端代理
 */

// 配置信息（请根据实际情况修改）
const CONFIG = {
  // 接入方式：'cloud' | 'direct' | 'proxy'
  mode: "cloud", // 默认使用云开发

  // 云开发配置（mode === 'cloud' 时使用）
  cloud: {
    functionName: "emotionAnalysis", // 云函数名称
  },

  // 直接API配置（mode === 'direct' 时使用，需要配置合法域名）
  direct: {
    // 示例：通义千问API
    apiUrl:
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    apiKey: "", // 请在此填入你的API Key
  },

  // 后端代理配置（mode === 'proxy' 时使用）
  proxy: {
    apiUrl: "https://your-backend.com/api/emotion-analysis", // 你的后端API地址
  },

  // 模型配置
  model: {
    provider: "qwen", // 'qwen' | 'openai' | 'custom'
    modelName: "qwen-turbo", // 模型名称
    temperature: 0.7,
    maxTokens: 1000,
  },
};

/**
 * 调用大模型进行情绪分析
 * @param {string} userText - 用户输入的情绪文本
 * @returns {Promise<Object>} 情绪分析结果
 */
function analyzeEmotionWithLLM(userText) {
  return new Promise((resolve, reject) => {
    if (!userText || !userText.trim()) {
      reject(new Error("输入文本不能为空"));
      return;
    }

    switch (CONFIG.mode) {
      case "cloud":
        callCloudFunction(userText).then(resolve).catch(reject);
        break;
      case "direct":
        callDirectAPI(userText).then(resolve).catch(reject);
        break;
      case "proxy":
        callProxyAPI(userText).then(resolve).catch(reject);
        break;
      default:
        reject(new Error("未配置接入方式"));
    }
  });
}

/**
 * 通过云函数调用大模型
 */
function callCloudFunction(userText) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: CONFIG.cloud.functionName,
      data: {
        text: userText,
        model: CONFIG.model,
      },
      success: (res) => {
        if (res.result && res.result.success) {
          resolve(parseLLMResponse(res.result.data));
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
 */
function callDirectAPI(userText) {
  return new Promise((resolve, reject) => {
    const prompt = buildPrompt(userText);

    wx.request({
      url: CONFIG.direct.apiUrl,
      method: "POST",
      header: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.direct.apiKey}`,
        "X-DashScope-SSE": "disable",
      },
      data: {
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
      },
      success: (res) => {
        console.log("📡 API完整响应:", JSON.stringify(res, null, 2));
        if (res.statusCode === 200 && res.data) {
          if (res.data.code) {
            reject(new Error(res.data.message || `API错误: ${res.data.code}`));
            return;
          }
          try {
            const result = parseDirectAPIResponse(res.data);
            console.log(
              "✅ 解析成功，返回结果:",
              JSON.stringify(result, null, 2)
            );
            resolve(result);
          } catch (error) {
            console.error("❌ 解析响应失败:", error);
            reject(new Error(`解析响应失败: ${error.message}`));
          }
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
            errorMsg =
              "域名未配置：请在小程序后台配置合法域名 dashscope.aliyuncs.com，或使用云开发方式";
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
 */
function callProxyAPI(userText) {
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
  "reminderMessage": "友善的提醒消息，例如：这里是缓一下，一个专门提供情绪支持的空间。如果你有情绪困扰或需要倾诉，我很愿意倾听。"
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
        "这里是缓一下，一个专门提供情绪支持的空间。如果你有情绪困扰或需要倾诉，我很愿意倾听。";
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
        "你好！这里是缓一下，如果你有什么情绪困扰，可以随时告诉我。";
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
