import type { Discrepancy, MentorQuestion, TraceStep } from '@/types';

// API Provider configuration
type ApiProvider = 'groq' | 'openai';

const getApiConfig = () => {
  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase() as ApiProvider;
  
  if (provider === 'groq') {
    return {
      provider: 'groq' as const,
      apiKey: process.env.GROQ_API_KEY || '',
      baseURL: 'https://api.groq.com/openai/v1',
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant', // Updated: llama-3.1-70b-versatile was decommissioned
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
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function generateMentorQuestion(
  discrepancy: Discrepancy,
  code: string,
  trace: TraceStep[]
): Promise<MentorQuestion> {
  const config = getApiConfig();
  
  if (!config.apiKey) {
    // Fallback questions if no API key
    return {
      question: `Why do you think ${discrepancy.variableName} didn't update as you expected at step ${discrepancy.step}?`,
      type: 'socratic',
      relatedStep: discrepancy.step,
    };
  }

  try {
    const prompt = `You are a Socratic coding mentor. A student predicted that variable "${discrepancy.variableName}" would be ${JSON.stringify(discrepancy.userVariable)} at step ${discrepancy.step}, but it's actually ${JSON.stringify(discrepancy.actualVariable)}.

Code:
\`\`\`javascript
${code}
\`\`\`

Trace at step ${discrepancy.step}:
${JSON.stringify(trace[discrepancy.step - 1], null, 2)}

Generate a Socratic question that guides the student to discover why their prediction was wrong. DO NOT give the answer directly. Ask a question that makes them think about:
- What condition controls this variable?
- What was the previous value?
- What operation changes this variable?

Return ONLY the question, no explanation.`;

    const question = await callAI(
      [
        {
          role: 'system',
          content: 'You are a Socratic coding mentor. You ask guiding questions, never give direct answers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      config
    );

    return {
      question: question || 'What do you think caused this discrepancy?',
      type: 'socratic',
      relatedStep: discrepancy.step,
    };
  } catch (error: any) {
    console.error('Error generating mentor question:', error);
    // If model is decommissioned, suggest updating the model
    if (error.message?.includes('decommissioned') || error.message?.includes('model_decommissioned')) {
      console.warn('Model decommissioned. Please update GROQ_MODEL in your .env file to a supported model like "llama-3.1-8b-instant"');
    }
    return {
      question: `Why do you think ${discrepancy.variableName} didn't update as you expected at step ${discrepancy.step}?`,
      type: 'socratic',
      relatedStep: discrepancy.step,
    };
  }
}

export async function generateMentorQuestions(
  discrepancies: Discrepancy[],
  code: string,
  trace: TraceStep[]
): Promise<MentorQuestion[]> {
  const questions: MentorQuestion[] = [];
  
  // Generate questions for up to 3 most significant discrepancies
  const significantDiscrepancies = discrepancies.slice(0, 3);
  
  for (const discrepancy of significantDiscrepancies) {
    const question = await generateMentorQuestion(discrepancy, code, trace);
    questions.push(question);
  }
  
  return questions;
}

