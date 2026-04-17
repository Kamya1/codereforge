import { NextRequest, NextResponse } from 'next/server';
import { generateMentorQuestions } from '@/lib/ai/mentor';
import type { Discrepancy, TraceStep } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discrepancies, code, trace } = body;

    if (!discrepancies || !code) {
      return NextResponse.json(
        { error: 'Discrepancies and code are required' },
        { status: 400 }
      );
    }

    const questions = await generateMentorQuestions(
      discrepancies as Discrepancy[],
      code,
      trace as TraceStep[]
    );

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('Mentor API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate mentor questions' },
      { status: 500 }
    );
  }
}

