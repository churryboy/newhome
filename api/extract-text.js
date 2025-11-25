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

        console.log('Processing image with OpenAI Vision API...');

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
                                text: `이 이미지에서 이벤트 제목과 날짜를 추출해주세요. 

다음 형식으로 JSON만 반환해주세요:
{
  "title": "이벤트 제목",
  "date": "YYYY-MM-DD"
}

규칙:
- 제목: 가장 중요해 보이는 제목이나 주요 텍스트
- 날짜: "11월 17일" 같은 형식이면 올해 년도를 붙여서 YYYY-MM-DD 형식으로 변환
- 년도가 명시되지 않으면 ${new Date().getFullYear()}년으로 가정
- 날짜가 없으면 date를 빈 문자열로
- 제목이 없으면 title을 빈 문자열로
- JSON 외에 다른 텍스트는 포함하지 마세요`
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
                max_tokens: 500
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
            title: result.title || '',
            date: result.date || '',
            rawText: content
        });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: error.message || 'Internal server error' 
        });
    }
};

