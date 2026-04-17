'use client';

import { useChallengeStore } from '@/store/useChallengeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ConceptCard() {
  const { conceptsLearned } = useChallengeStore();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (conceptsLearned.length > 0) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [conceptsLearned]);

  if (conceptsLearned.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Concepts Learned ({conceptsLearned.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conceptsLearned.map((concept, idx) => (
              <Card
                key={idx}
                className={`border-primary transition-all duration-500 ${
                  idx === conceptsLearned.length - 1 && showAnimation ? 'scale-105 shadow-lg' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">{concept.concept}</p>
                    <p className="text-sm text-muted-foreground">{concept.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

