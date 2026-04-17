'use client';

import { useChallengeStore } from '@/store/useChallengeStore';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { PredictionForm } from '@/components/trace/PredictionForm';
import { ExecutionVisualization } from '@/components/visualization/ExecutionVisualization';
import { MentorQuestions } from '@/components/visualization/MentorQuestions';
import { ConceptCard } from '@/components/visualization/ConceptCard';
import { TraceComparison } from '@/components/visualization/TraceComparison';
import { ThinkingAnalysis } from '@/components/visualization/ThinkingAnalysis';
import { TestCaseResults } from '@/components/visualization/TestCaseResults';
import { TraceTable } from '@/components/trace/TraceTable';
import { CodeSubmissionForm } from '@/components/code/CodeSubmissionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Play, Lock, CheckCircle2, Home as HomeIcon, BookOpen, Code } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useState } from 'react';
import type { Challenge } from '@/types';
import { bugscppChallenges } from '@/lib/data/bugscpp-challenges';
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from '@/lib/utils/keyboard-shortcuts';

const sampleChallenges: Challenge[] = [...bugscppChallenges];

export default function Home() {
  const {
    challenge,
    prediction,
    executionResult,
    isLocked,
    fixedCode,
    fixSubmitted,
    fixValidated,
    setChallenge,
    setExecutionResult,
    setDiscrepancies,
    setMentorQuestions,
    setFixSubmitted,
    setFixValidated,
    markChallengeComplete,
    clearCurrentChallenge,
  } = useChallengeStore();

  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [mode, setMode] = useState<'challenges' | 'debug'>('challenges');

  useKeyboardShortcuts([
    {
      ...COMMON_SHORTCUTS.EXECUTE,
      action: () => {
        if (!isLocked && !isExecuting) handleExecute();
      },
    },
  ]);

  const handleExecute = async () => {
    if (!challenge || isLocked) return;

    setIsExecuting(true);
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: challenge.code }),
      });

      const result = await response.json();
      setExecutionResult(result);
      setDiscrepancies(result.discrepancies || []);
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">

        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold">CodeReforge</h1>
            <p className="text-muted-foreground">
              Rebuild Your Logic — Think Before You Run
            </p>
          </div>
          <ThemeToggle />
        </div>

        {!challenge ? (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Mode</CardTitle>
              <CardDescription>
                Select how you want to practice debugging and understanding code
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">

              <Card onClick={() => setMode('challenges')} className="cursor-pointer">
                <CardHeader>
                  <CardTitle>Try Challenges</CardTitle>
                  <CardDescription>
                    Practice with pre-saved buggy code
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card onClick={() => setMode('debug')} className="cursor-pointer">
                <CardHeader>
                  <CardTitle>Debug My Code</CardTitle>
                  <CardDescription>
                    Paste your own code and debug it
                  </CardDescription>
                </CardHeader>
              </Card>

            </CardContent>
          </Card>
        ) : (

          <Card>
            <CardHeader>
              <CardTitle>{challenge.title}</CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </CardHeader>

            <CardContent>

              <CodeEditor readOnly height="250px" />

              {!executionResult && (
                <Button onClick={handleExecute} className="mt-4 w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Run Code
                </Button>
              )}

              {executionResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Execution Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExecutionVisualization />
                  </CardContent>
                </Card>
              )}

              {executionResult && challenge.hasBug === false && (
                <Card className="mt-4 border-green-500">
                  <CardHeader>
                    <CardTitle>
                      Code Analysis Complete
                    </CardTitle>
                    <CardDescription>
                      You&apos;ve successfully traced through your code and understood its logic!
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Your code has no bugs. You&apos;ve successfully traced through your code. Great job!
                    </p>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={clearCurrentChallenge}
                variant="outline"
                className="mt-4 w-full"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Back
              </Button>

            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
