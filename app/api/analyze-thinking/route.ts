import { NextRequest, NextResponse } from 'next/server';
import { analyzeUserThinking } from '@/lib/ai/thinking-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prediction, code, challengeDescription } = body;

    if (!prediction || !code) {
      return NextResponse.json(
        { error: 'Prediction and code are required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeUserThinking(
      prediction,
      code,
      challengeDescription
    );

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('Thinking analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze thinking' },
      { status: 500 }
    );
  }
}

