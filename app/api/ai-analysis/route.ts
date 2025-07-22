import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
    try {
        const { scanResults } = await request.json();

        // ✅ Use consistent environment variable name
        if (!process.env.GEMINI_API_KEY) {
            console.error('🔍 Gemini API key not found in environment variables');
            return Response.json({ error: 'Gemini API key not configured' }, { status: 500 });
        }

        console.log('🔍 Initializing Gemini AI...');
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,  // ✅ Use the same variable you're checking for
        });

        // Generate the prompt based on scan results
        const generatePrompt = (results: any) => {
            const classDistribution = results.results?.class_distribution || {};

            // Calculate attack breakdown
            const attackBreakdown = Object.entries(classDistribution)
                .filter(([key, count]) => key !== 'class_0' && (count as number) > 0)
                .map(([key, count]) => {
                    const labels: { [key: string]: string } = {
                        class_1: "DoS/DDoS Attacks",
                        class_2: "Port Scans",
                        class_3: "Bot Attacks",
                        class_4: "Infiltration Attempts",
                        class_5: "Web Attacks",
                        class_6: "Brute Force Attacks",
                        class_7: "Heartbleed Exploits",
                        class_8: "SQL Injection",
                    };
                    const percentage = ((count as number) / results.anomalies_detected * 100).toFixed(1);
                    return `• ${labels[key] || key}: ${(count as number).toLocaleString()} (${percentage}% of threats)`;
                })
                .join('\n');

            return `Analyze this network security scan and provide brief, actionable recommendations:

SCAN RESULTS:
• Total Traffic: ${results.total_records?.toLocaleString()} records analyzed
• Threat Level: ${results.anomaly_rate > 20 ? 'HIGH' : results.anomaly_rate > 10 ? 'MEDIUM' : 'LOW'} (${results.anomaly_rate?.toFixed(1)}% anomaly rate)
• Anomalies Detected: ${results.anomalies_detected?.toLocaleString()} incidents

ATTACK BREAKDOWN:
${attackBreakdown}

IMMEDIATE ACTIONS NEEDED:
1. What should be done RIGHT NOW to address the highest threat volume?
2. How can we stop the most critical attacks immediately?
3. What mitigation should be implemented urgently?

PREVENTION STRATEGY:
4. What specific security controls prevent these attack types?
5. What monitoring should be enhanced?
6. What is the recommended incident response plan?

Provide concise, prioritized recommendations for a network security team to implement within 24-48 hours.`;
        };

        console.log('🔍 Generating prompt...');
        const prompt = generatePrompt(scanResults);
        console.log('🔍 Prompt generated, length:', prompt.length);

        console.log('🔍 Sending prompt to Gemini...');

        const config = {
            thinkingConfig: {
                thinkingBudget: 0,
            },
            responseMimeType: 'text/plain',
        };

        const model = 'gemini-2.5-flash';

        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ];

        // ✅ Add more detailed error handling
        try {
            const response = await ai.models.generateContent({
                model,
                config,
                contents,
            });

            console.log('🔍 Gemini response received:', response);

            // ✅ Try multiple ways to extract the text
            let aiResponse = '';
            if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                aiResponse = response.candidates[0].content.parts[0].text;
            } else if (response.text) {
                aiResponse = response.text;
            } else {
                console.error('🔍 No text found in response structure:', JSON.stringify(response, null, 2));
                aiResponse = 'No response generated';
            }

            console.log('🔍 AI response extracted, length:', aiResponse.length);

            return Response.json({
                analysis: aiResponse,
                prompt: prompt
            });

        } catch (geminiError) {
            console.error('🔍 Gemini API call error:', geminiError);
            throw geminiError;
        }

    } catch (error) {
        console.error('🔍 AI analysis error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            type: typeof error,
            error: error
        });
        
        return Response.json(
            { 
                error: error instanceof Error ? error.message : 'AI analysis failed',
                details: 'Check server logs for more information'
            },
            { status: 500 }
        );
    }
}