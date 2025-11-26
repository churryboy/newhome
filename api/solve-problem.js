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
- LaTeX의 백슬래시는 JSON에서 반드시 이중 백슬래시로 작성하세요 (예: $x^2$, $\\\\frac{a}{b}$, $\\\\sqrt{x}$, $\\\\pm$)
- 인라인 수식은 $...$ 로 감싸고, 블록 수식은 $$...$$ 로 감싸세요
- 각 단계는 구체적으로 계산 과정을 보여주세요
- 설명은 한글로 하되 수식은 LaTeX로 표현하세요
- 최소 3단계, 최대 6단계로 구성해주세요
- JSON 외에 다른 텍스트나 마크다운 코드 블록은 포함하지 마세요 (JSON만 반환)
- 중학생이 이해하기 쉽게 설명해주세요

**중요:** LaTeX 백슬래시는 \\\\로 두 번 써야 합니다!
예시:
"$f_2(3)$를 계산하면, $n=2$일 때 3의 제곱근은 $\\\\pm\\\\sqrt{3}$으로 2개입니다."`
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
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }

        const result = JSON.parse(jsonMatch[0]);

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

