'use client';

import { useChallengeStore } from '@/store/useChallengeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function TraceComparison() {
  const { prediction, executionResult, discrepancies } = useChallengeStore();

  if (!prediction || !executionResult) return null;

  const userTrace = prediction.traceSteps || [];
  const actualTrace = executionResult.trace || [];

  if (userTrace.length === 0 && actualTrace.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Prediction vs Actual Execution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No trace data available for comparison. {userTrace.length === 0 && 'Please add trace steps in your prediction.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Prediction vs Actual Execution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Your Prediction</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userTrace.map((step, idx) => {
                const hasDiscrepancy = discrepancies.some(d => d.step === step.step);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-md border ${
                      hasDiscrepancy ? 'border-destructive bg-destructive/5' : 'border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono">Step {step.step}</span>
                      {hasDiscrepancy ? (
                        <XCircle className="w-3 h-3 text-destructive" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Line {step.line}</p>
                    <pre className="text-xs mt-1 bg-muted p-1 rounded">
                      {JSON.stringify(step.variables, null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Actual Execution</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {actualTrace.map((step, idx) => {
                const hasDiscrepancy = discrepancies.some(d => d.step === step.step);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-md border ${
                      hasDiscrepancy ? 'border-destructive bg-destructive/5' : 'border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono">Step {step.step}</span>
                      {hasDiscrepancy && (
                        <AlertCircle className="w-3 h-3 text-destructive" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Line {step.line}</p>
                    <pre className="text-xs mt-1 bg-muted p-1 rounded">
                      {JSON.stringify(step.variables, null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {discrepancies.length > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 rounded-md border border-destructive">
            <p className="text-sm font-semibold text-destructive mb-2">
              {discrepancies.length} Discrepancy{discrepancies.length > 1 ? 'ies' : ''} Found
            </p>
            <p className="text-xs text-muted-foreground">
              Your predictions differ from the actual execution. Review the highlighted steps above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

