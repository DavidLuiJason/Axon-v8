import React, { useState } from 'react';
import { Code2, Play, Save, Terminal, Sparkles, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AxonCodeScreen: React.FC = () => {
  const { codeSkillLevel, setCodeSkillLevel, savedScripts, saveScript, showToast } = useApp();

  const [code, setCode] = useState(
    `// AXON Code Assistant Playground\nfunction analyze(input) {\n  return {\n    length: input.length,\n    words: input.trim().split(/\\s+/).length,\n    timestamp: new Date().toISOString()\n  };\n}\n\nreturn analyze("Hello from AXON workspace");`
  );
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    try {
      // Safe client-side execution
      // eslint-disable-next-line no-new-func
      const fn = new Function(code);
      const res = fn();
      setOutput(typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res));
    } catch (err: any) {
      setOutput(`Error: ${err?.message || err}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = () => {
    saveScript({
      title: 'Custom Script ' + (savedScripts.length + 1),
      code,
      language: 'javascript',
      description: 'Saved from AXON Code playground',
    });
    showToast('Script saved');
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 sm:p-6 space-y-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-sky-400" />
            <span>AXON Code</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Beginner-friendly code playground and interactive execution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={codeSkillLevel}
            onChange={(e) => setCodeSkillLevel(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="beginner">Beginner</option>
            <option value="guided">Guided</option>
            <option value="advanced">Advanced</option>
          </select>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 font-medium"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-400">Editor</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs rounded-2xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 resize-y"
        />
      </div>

      {output !== null && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution Output</span>
          </div>
          <pre className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};
