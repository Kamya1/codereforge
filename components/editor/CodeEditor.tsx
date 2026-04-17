'use client';

import { Editor } from '@monaco-editor/react';
import { useChallengeStore } from '@/store/useChallengeStore';

interface CodeEditorProps {
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({ readOnly = false, height = '400px' }: CodeEditorProps) {
  const { challenge, fixedCode, setFixedCode } = useChallengeStore();
  const code = fixedCode || challenge?.code || '';
  const language = challenge?.language || 'cpp';

  const handleEditorChange = (value: string | undefined) => {
    if (!readOnly && value !== undefined) {
      setFixedCode(value);
    }
  };

  // Map language to Monaco language
  const monacoLanguage = language === 'cpp' ? 'cpp' : language;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage={monacoLanguage}
        language={monacoLanguage}
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}

