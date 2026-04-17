'use client';

import { useChallengeStore } from '@/store/useChallengeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export function MentorQuestions() {
  const { mentorQuestions } = useChallengeStore();

  if (mentorQuestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Mentor Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mentorQuestions.map((question, idx) => (
            <div key={idx} className="p-4 bg-primary/10 rounded-md border-l-4 border-primary">
              <p className="text-sm font-medium mb-1">Question {idx + 1}:</p>
              <p className="text-sm">{question.question}</p>
              {question.relatedStep && (
                <p className="text-xs text-muted-foreground mt-2">
                  Related to step {question.relatedStep}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

