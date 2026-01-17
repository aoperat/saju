// --- OpenAI API 호출 ---
export const callOpenAI = async (prompt) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("OpenAI API key is not set. Please set VITE_OPENAI_API_KEY in .env file.");
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-chat-latest",
        messages: [
          {
            role: "system",
            content: `당신은 전문 사주명리학자입니다. 사주팔자를 분석하여 운세를 해석해주세요.
            답변은 한국어로 하고, 따뜻하고 긍정적인 톤을 유지하면서도 현실적인 조언을 해주세요.
            전통적인 사주명리학의 용어를 적절히 사용하되, 이해하기 쉽게 설명해주세요.
            각 운세 항목은 2-3문장으로 간결하게 작성해주세요.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 16384, // GPT-5 최대값
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return null;
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return null;
  }
};




