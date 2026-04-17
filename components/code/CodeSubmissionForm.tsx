'use client';

import { useState } from 'react';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Code, Bug, CheckCircle2 } from 'lucide-react';
import { useChallengeStore } from '@/store/useChallengeStore';
import type { Challenge } from '@/types';

export function CodeSubmissionForm() {
  const { setChallenge } = useChallengeStore();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<'cpp' | 'javascript' | 'python' | 'typescript'>('cpp');
  const [problemStatement, setProblemStatement] = useState('');
  const [testCases, setTestCases] = useState<Array<{ input: string; expectedOutput: string; description?: string }>>([
    { input: '', expectedOutput: '' }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    hasBug: boolean;
    description: string;
    concepts: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    bugDescription?: string;
  } | null>(null);

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '' }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (index: number, field: 'input' | 'expectedOutput' | 'description', value: string) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast({
        variant: 'warning',
        title: 'Code Required',
        description: 'Please paste your code before analyzing.',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          language, 
          problemStatement: problemStatement.trim() || undefined,
          testCases: testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim()).length > 0 
            ? testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim())
            : undefined
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: data.error,
        });
        return;
      }

      setAnalysisResult(data.analysis);
      
      toast({
        variant: data.analysis.hasBug ? 'warning' : 'success',
        title: data.analysis.hasBug ? 'Bug Detected!' : 'No Bugs Found',
        description: data.analysis.hasBug 
          ? 'AI found potential issues. You can debug step-by-step.'
          : 'Code looks good! You can trace through it to understand the logic.',
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: 'Failed to analyze code. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartDebugging = () => {
    if (!code.trim() || !analysisResult) return;

    const validTestCases = testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());

    const challenge: Challenge = {
      id: `user-${Date.now()}`,
      title: analysisResult.hasBug ? 'Your Code - Bug Detected' : 'Your Code - Trace & Understand',
      description: analysisResult.description,
      code,
      language,
      difficulty: analysisResult.difficulty,
      concepts: analysisResult.concepts,
      isUserSubmitted: true,
      hasBug: analysisResult.hasBug ? true : false,
      bugDescription: analysisResult.bugDescription,
      problemStatement: problemStatement.trim() || undefined,
      testCases: validTestCases.length > 0 ? validTestCases.map(tc => ({
        input: tc.input.trim(),
        expectedOutput: tc.expectedOutput.trim(),
        description: tc.description?.trim()
      })) : undefined,
    };

    setChallenge(challenge);
    
    toast({
      variant: 'success',
      title: 'Challenge Created!',
      description: analysisResult.hasBug 
        ? 'Start by predicting what the code does and tracing execution.'
        : 'Trace through your code to understand the logic step-by-step.',
    });
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Debug Your Own Code
        </CardTitle>
        <CardDescription>
          Paste your code here. AI will analyze it to detect bugs and help you understand the logic.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        <div>
          <label className="block text-sm font-medium mb-2">
            Problem Statement <span className="text-muted-foreground text-xs">(Optional - for contest problems)</span>
          </label>
          <textarea
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder="Paste the problem statement here... This helps AI understand what the code should do."
            className="w-full p-3 border border-input rounded-md min-h-[100px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="w-full p-2 border border-input rounded-md"
          >
            <option value="cpp">C++</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Your Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-3 border border-input rounded-md min-h-[200px] font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Test Cases</label>

          {testCases.map((tc, index) => (
            <div key={index} className="space-y-2 mb-2">

              <textarea
                value={tc.input}
                onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                placeholder={"Test input (one line per input value, e.g., '5\\n10' for two integers)"}
                className="w-full p-2 border border-input rounded-md font-mono text-sm"
              />

              <textarea
                value={tc.expectedOutput}
                onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                placeholder="Expected output"
                className="w-full p-2 border border-input rounded-md font-mono text-sm"
              />

            </div>
          ))}

          <Button onClick={addTestCase}>Add Test Case</Button>
        </div>

        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="animate-spin" /> : 'Analyze Code'}
        </Button>

      </CardContent>
    </Card>
  );
}
