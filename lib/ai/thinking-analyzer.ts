import type { Prediction, ThinkingAnalysis } from '@/types';

// API Provider configuration
type ApiProvider = 'groq' | 'openai';

const getApiConfig = () => {
  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase() as ApiProvider;
  
  if (provider === 'groq') {
    return {
      provider: 'groq' as const,
      apiKey: process.env.GROQ_API_KEY || '',
      baseURL: 'https://api.groq.com/openai/v1',
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    };
  } else {
    return {
      provider: 'openai' as const,
      apiKey: process.env.OPENAI_API_KEY || '',
      baseURL: 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4',
    };
  }
};

async function callAI(messages: Array<{ role: string; content: string }>, config: ReturnType<typeof getApiConfig>) {
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function analyzeUserThinking(
  prediction: Prediction,
  code: string,
  challengeDescription?: string
): Promise<ThinkingAnalysis> {
  const config = getApiConfig();
  
  // Check for low-effort responses - only flag if the ENTIRE response is low-effort
  // Don't flag if they provided actual analysis but used uncertainty words like "maybe"
  const descriptionLower = prediction.description.toLowerCase().trim();
  const descriptionLength = descriptionLower.length;
  
  // Patterns that indicate NO analysis when they're the main content
  const noAnalysisPatterns = [
    "i don't know", "i dont know", "idk", "no idea", "dunno", 
    "no clue", "whatever", "random"
  ];
  
  // Check if the description is ONLY a low-effort phrase (not part of actual analysis)
  const isOnlyLowEffort = noAnalysisPatterns.some(pattern => {
    // Check if the description is just the pattern or very close to it
    const trimmed = descriptionLower.replace(/[^a-z0-9\s]/g, '').trim();
    return trimmed === pattern || trimmed.length <= pattern.length + 3;
  });
  
  // Also flag if it's extremely short AND contains uncertainty without substance
  const isLowEffort = isOnlyLowEffort || 
    (descriptionLength < 15 && (
      descriptionLower === "not sure" || 
      descriptionLower === "unsure" ||
      descriptionLower === "maybe" ||
      descriptionLower === "probably" ||
      descriptionLower === "guess" ||
      descriptionLower.match(/^[?]+$/) // Just question marks
    ));

  if (!config.apiKey) {
    // Fallback analysis if no API key
    if (isLowEffort) {
      return {
        reasoningQuality: 'unclear',
        strengths: [],
        weaknesses: ['No actual code analysis was provided'],
        misconceptions: [],
        suggestions: ['Read through the code line by line', 'Trace variable values as the code executes', 'Make a genuine attempt to predict the output'],
        overallAssessment: 'You need to actually analyze the code to learn. Take time to trace through the execution step by step.',
      };
    }
    
    // Check if they showed understanding even without API
    const hasKeyConcepts = descriptionLength > 20 || 
      /factorial|loop|recursion|variable|function|array|pointer|memory|sum|count|increment|decrement/.test(descriptionLower);
    
    if (hasKeyConcepts) {
      return {
        reasoningQuality: 'needs_improvement',
        strengths: ['You\'re thinking in the right direction'],
        weaknesses: ['Try to be more confident and detailed in your analysis'],
        misconceptions: [],
        suggestions: ['Trace through the code step by step', 'Be more specific about what you think will happen'],
        overallAssessment: 'You\'re on the right track! Try to trace through the code execution more carefully and be more confident in your prediction.',
      };
    }
    
    return {
      reasoningQuality: 'unclear',
      strengths: [],
      weaknesses: ['Could provide more detail'],
      misconceptions: [],
      suggestions: ['Try to think about each line of code step by step'],
      overallAssessment: 'Please analyze the code more carefully.',
    };
  }

  try {
    const prompt = `You are an expert programming mentor analyzing a student's thinking process. Be honest and direct - if the student hasn't actually engaged with the problem, rate them as "unclear" or "needs_improvement", NOT "good".

Challenge Description: ${challengeDescription || 'Debugging challenge'}

Code:
\`\`\`cpp
${code}
\`\`\`

Student's Prediction:
- Description: "${prediction.description}"
- Expected Output: "${prediction.expectedOutput}"
- Trace Steps: ${JSON.stringify(prediction.traceSteps || [], null, 2)}

CRITICAL: Distinguish between:
- NO analysis: Responses like "i don't know", "idk", "no idea" as the entire response → rate as "unclear"
- UNCERTAIN but engaged: Responses that show actual thinking but use words like "maybe", "probably", "i think" → rate based on the quality of their analysis, not the uncertainty word
- If they show they understand the problem (e.g., "factorial of 5 maybe") but are uncertain, that's "needs_improvement" or "good" depending on accuracy, NOT "unclear"

Analyze the student's thinking process and provide:
1. Reasoning Quality: 
   - "excellent" (deep, accurate analysis)
   - "good" (solid reasoning, correct direction even if uncertain)
   - "needs_improvement" (shows understanding but incomplete or has errors)
   - "unclear" (ONLY if they provided NO actual analysis - just "i don't know" etc.)
2. Strengths: List what they did well. If they showed understanding (even with "maybe"), acknowledge that.
3. Weaknesses: Be specific. If they're uncertain but on the right track, suggest being more confident in their analysis.
4. Misconceptions: List any incorrect assumptions or misunderstandings (if any)
5. Suggestions: Provide specific, actionable steps to improve their analysis
6. Overall Assessment: Be encouraging if they're on the right track, even if uncertain. Only be direct if they provided no analysis.

Return your response as a JSON object with this exact structure:
{
  "reasoningQuality": "excellent|good|needs_improvement|unclear",
  "strengths": ["strength1", "strength2"] or [] if none,
  "weaknesses": ["weakness1", "weakness2"],
  "misconceptions": ["misconception1"] or [],
  "suggestions": ["suggestion1", "suggestion2"],
  "overallAssessment": "Your honest assessment here"
}`;

    const response = await callAI(
      [
        {
          role: 'system',
          content: 'You are an expert programming mentor. Analyze student thinking and provide constructive feedback in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      config
    );

    // Try to parse JSON from response
    let analysis: ThinkingAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
      analysis = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, create a structured response from the text
      analysis = {
        reasoningQuality: response.toLowerCase().includes('excellent') ? 'excellent' :
                         response.toLowerCase().includes('good') ? 'good' :
                         response.toLowerCase().includes('unclear') ? 'unclear' : 'needs_improvement',
        strengths: extractListItems(response, ['strength', 'well', 'good', 'correct']),
        weaknesses: extractListItems(response, ['weakness', 'improve', 'better', 'consider']),
        misconceptions: extractListItems(response, ['misconception', 'incorrect', 'wrong', 'assume']),
        suggestions: extractListItems(response, ['suggest', 'recommend', 'try', 'should']),
        overallAssessment: response.substring(0, 300) || 'Analysis completed',
      };
    }

    // Only override if it's truly a no-analysis response (not just uncertainty)
    // If they provided actual analysis but AI rated it poorly, trust the AI
    // Only override if they literally provided no analysis and AI mistakenly said "good"
    if (isLowEffort && (analysis.reasoningQuality === 'good' || analysis.reasoningQuality === 'excellent')) {
      return {
        reasoningQuality: 'unclear',
        strengths: [],
        weaknesses: ['No actual code analysis was provided. You need to trace through the code step by step to understand what it does.'],
        misconceptions: [],
        suggestions: [
          'Read through the code line by line',
          'Trace variable values as the code executes',
          'Think about what each statement does and how they connect',
          'Make a genuine attempt to predict the output before submitting'
        ],
        overallAssessment: 'You need to actually analyze the code to learn from this exercise. Take time to trace through the execution step by step, track variable values, and make a thoughtful prediction. Simply saying "I don\'t know" won\'t help you learn.',
      };
    }

    // If they showed understanding (not low effort) but AI said unclear, upgrade it
    // This handles cases like "factorial of 5 maybe" - they're thinking correctly
    if (!isLowEffort && analysis.reasoningQuality === 'unclear') {
      // Check if they mentioned key concepts or showed understanding
      const hasKeyConcepts = descriptionLength > 20 || 
        /factorial|loop|recursion|variable|function|array|pointer|memory|sum|count|increment|decrement|while|for|if/.test(descriptionLower);
      
      if (hasKeyConcepts) {
        analysis.reasoningQuality = 'needs_improvement';
        if (analysis.strengths.length === 0) {
          analysis.strengths = ['You\'re thinking in the right direction'];
        }
        if (analysis.overallAssessment.toLowerCase().includes('no analysis') || 
            analysis.overallAssessment.toLowerCase().includes('didn\'t engage') ||
            analysis.overallAssessment.toLowerCase().includes('need to actually')) {
          analysis.overallAssessment = 'You\'re on the right track! Try to be more confident in your analysis and trace through the code step by step.';
        }
      }
    }

    // Validate and ensure all fields are present
    return {
      reasoningQuality: analysis.reasoningQuality || 'unclear',
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || ['Need to provide more detailed analysis'],
      misconceptions: analysis.misconceptions || [],
      suggestions: analysis.suggestions || ['Trace through the code step by step'],
      overallAssessment: analysis.overallAssessment || 'Please analyze the code more carefully.',
    };
  } catch (error) {
    console.error('Error analyzing thinking:', error);
    
    // Check for low-effort responses in error fallback too
    if (isLowEffort) {
      return {
        reasoningQuality: 'unclear',
        strengths: [],
        weaknesses: ['No actual code analysis was provided'],
        misconceptions: [],
        suggestions: ['Read through the code line by line', 'Trace variable values as the code executes', 'Make a genuine attempt to predict the output'],
        overallAssessment: 'You need to actually analyze the code to learn. Take time to trace through the execution step by step.',
      };
    }

    return {
      reasoningQuality: 'unclear',
      strengths: [],
      weaknesses: ['Could provide more detailed reasoning'],
      misconceptions: [],
      suggestions: ['Trace through the code step by step', 'Consider edge cases'],
      overallAssessment: 'Please analyze the code more carefully.',
    };
  }
}

function extractListItems(text: string, keywords: string[]): string[] {
  const items: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      // Extract bullet points or numbered items
      const match = line.match(/[-*•]\s*(.+)|^\d+[.)]\s*(.+)/);
      if (match) {
        items.push((match[1] || match[2] || line).trim());
      }
    }
    if (items.length >= 3) break;
  }
  
  return items.length > 0 ? items : ['Consider analyzing the code more carefully'];
}

