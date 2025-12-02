const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ 
                error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables' 
            });
        }

        console.log('Processing math problem with OpenAI Vision API...');

        // Call OpenAI Vision API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `이미지에 있는 수학 문제를 정확히 분석하고 단계별 풀이를 작성해주세요.

다음 형식의 JSON만 반환해주세요:
{
  "steps": [
    {
      "number": 1,
      "content": "문제 분석 및 풀이 전략 설명"
    },
    {
      "number": 2,
      "content": "구체적인 계산 과정"
    },
    {
      "number": 3,
      "content": "최종 답: [답]"
    }
  ]
}

규칙:
- 이미지의 실제 문제를 정확히 분석하고 풀이하세요
- 수식은 LaTeX 형식으로 작성하세요
- JSON 외에 다른 텍스트는 포함하지 마세요 (JSON만 반환)
- 각 단계는 구체적으로 계산 과정을 보여주세요
- 설명은 한글로 하되 수식은 LaTeX로 표현하세요
- 최소 3단계, 최대 6단계로 구성해주세요
- 중학생이 이해하기 쉽게 설명해주세요

**LaTeX 수식 작성 규칙 (매우 중요!):**
- 인라인 수식은 $...$ 로 감싸세요
- 모든 LaTeX 명령어에는 백슬래시 1개만 사용하세요
- 예시: "$\\frac{a}{b}$", "$\\sqrt{x}$", "$\\pm$", "$5^{\\frac{83}{6}}$"
- 잘못된 예: "$\\\\frac{a}{b}$" (백슬래시 2개는 틀림!)
- 올바른 예: "최종 답: $5^{\\frac{83}{6}}$"`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: image
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error:', errorData);
            return res.status(response.status).json({ 
                error: errorData.error?.message || 'OpenAI API request failed' 
            });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        console.log('AI Response:', content);

        // Parse JSON response
        let jsonText = content;
        
        // Remove markdown code blocks if present
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            jsonText = codeBlockMatch[1];
        } else {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonText = jsonMatch[0];
            }
        }

        if (!jsonText) {
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }

        // Fix single backslashes in LaTeX (e.g., \frac -> \\frac)
        // But preserve already-escaped backslashes (\\frac stays \\frac)
        jsonText = jsonText.replace(/([^\\])\\([a-zA-Z])/g, '$1\\\\$2');

        const result = JSON.parse(jsonText);

        res.json({
            solution: result,
            rawText: content
        });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: error.message || 'Internal server error' 
        });
    }
};

