/**
 * 情绪分析云函数
 * 调用大模型API进行情绪分析
 *
 * 部署步骤：
 * 1. 在微信开发者工具中右键 cloudfunctions/emotionAnalysis 文件夹
 * 2. 选择"上传并部署：云端安装依赖"
 * 3. 等待部署完成
 */

const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 配置你的大模型API
// ⚠️ 重要：请在此填入你的百炼平台API Key
const LLM_CONFIG = {
  // 百炼平台（通义千问）配置
  provider: "qwen", // 'qwen' | 'openai' | 'custom'
  apiUrl:
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
  apiKey: "sk-1b9f583964144fe1973bd6eed4082b51", // ⬅️ 请在此填入你的百炼平台API Key

  // OpenAI配置示例
  // provider: 'openai',
  // apiUrl: 'https://api.openai.com/v1/chat/completions',
  // apiKey: '',

  model: "qwen-max", // 模型名称，可选：qwen-turbo, qwen-plus, qwen-max
  temperature: 0.9, // 提高温度值，增加生成内容的多样性和随机性
  maxTokens: 1000,
};

exports.main = async (event, context) => {
  const { text, model } = event;

  if (!text || !text.trim()) {
    return {
      success: false,
      error: "输入文本不能为空",
    };
  }

  try {
    const analysis = await callLLMAPI(text, model || LLM_CONFIG);

    return {
      success: true,
      data: analysis,
    };
  } catch (error) {
    console.error("大模型调用失败:", error);
    return {
      success: false,
      error: error.message || "分析失败，请稍后重试",
    };
  }
};

/**
 * 调用大模型API
 */
async function callLLMAPI(text, config) {
  const prompt = buildPrompt(text);

  // 根据不同的provider调用不同的API
  switch (config.provider) {
    case "qwen":
      return await callQwenAPI(prompt, config);
    case "openai":
      return await callOpenAIAPI(prompt, config);
    default:
      throw new Error("不支持的模型提供商");
  }
}

/**
 * 调用通义千问API
 */
async function callQwenAPI(prompt, config) {
  const axios = require("axios");

  const response = await axios.post(
    config.apiUrl,
    {
      model: config.model,
      input: {
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      parameters: {
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
    }
  );

  if (response.data && response.data.output && response.data.output.choices) {
    const content = response.data.output.choices[0].message.content;
    return parseLLMResponse(content);
  }

  throw new Error("API响应格式错误");
}

/**
 * 调用OpenAI API
 */
async function callOpenAIAPI(prompt, config) {
  const axios = require("axios");

  const response = await axios.post(
    config.apiUrl,
    {
      model: config.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
    }
  );

  if (response.data && response.data.choices) {
    const content = response.data.choices[0].message.content;
    return parseLLMResponse(content);
  }

  throw new Error("API响应格式错误");
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
    // 如果响应是字符串，尝试解析JSON
    let data = response;
    if (typeof response === "string") {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
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
    const actions = Array.isArray(data.actions)
      ? data.actions
          .map((action) => ({
            emoji: action.emoji || "",
            text: action.text || "",
          }))
          .filter((action) => action.text)
          .slice(0, 3)
      : [];

    // 获取comfortText
    const comfortText = data.comfortText || "";

    return {
      isEmotionIssue: true,
      emotions,
      reasons,
      clarification,
      actions,
      comfortText,
    };
  } catch (error) {
    console.error("解析响应失败:", error);
    throw error;
  }
}
