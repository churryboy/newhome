// Backend server for D-Day Manager
// Handles OpenAI API calls securely

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.')); // Serve static files from current directory

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// OCR endpoint using OpenAI Vision API
app.post('/api/extract-text', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ 
                error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to .env file' 
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
});

// Solve Problem endpoint using OpenAI Vision API
app.post('/api/solve-problem', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ 
                error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to .env file' 
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

        // Parse JSON response - extract from code blocks if needed
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
});

// Email notification endpoint
app.post('/api/send-notification', async (req, res) => {
    try {
        const { userEmail, itemCount, total } = req.body;

        console.log('📧 Sending notification email to dino.lee@mathpresso.com');
        console.log('User Email:', userEmail);
        console.log('Items:', itemCount);
        console.log('Total:', total);

        const emailBody = `
New purchase notification:
========================
User Email: ${userEmail}
Number of Items: ${itemCount}
Total Amount: ₩${total}
========================
        `;

        console.log('Email Body:', emailBody);

        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️  Email credentials not configured. Skipping email send.');
            console.log('ℹ️  To enable email notifications, set EMAIL_USER and EMAIL_PASS in .env file');
            res.json({ 
                success: true,
                message: 'Notification logged (email credentials not configured)'
            });
            return;
        }

        // Create transporter with Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS  // Use App Password, not regular password
            }
        });

        // Send email to dino.lee@mathpresso.com
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'dino.lee@mathpresso.com',
            subject: '🛒 New Purchase Notification - 콴다',
            text: emailBody,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #6366F1; margin-bottom: 20px;">🛒 New Purchase Notification</h2>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                            <p style="margin: 10px 0;"><strong>User Email:</strong> ${userEmail}</p>
                            <p style="margin: 10px 0;"><strong>Number of Items:</strong> ${itemCount}</p>
                            <p style="margin: 10px 0;"><strong>Total Amount:</strong> ₩${total}</p>
                        </div>
                        <p style="color: #666; font-size: 14px; margin-top: 30px;">
                            This is an automated notification from the 콴다 shopping cart system.
                        </p>
                    </div>
                </div>
            `
        });

        console.log('✅ Email sent successfully! Message ID:', info.messageId);

        res.json({ 
            success: true,
            message: 'Notification email sent successfully',
            messageId: info.messageId
        });
    } catch (error) {
        console.error('❌ Error sending notification email:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to send notification' 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📅 D-Day Manager is ready!`);
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  WARNING: OPENAI_API_KEY not found in .env file');
    } else {
        console.log('✅ OpenAI API key configured');
    }
});
