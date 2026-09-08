export function detectSelfKnowledgeQuery(text: string): { matches: boolean; response: string } {
  const norm = text.trim().toLowerCase();
  const selfQueries = [
    'who are you',
    'what are you',
    'what is axon',
    'what can you do',
    'describe yourself',
    'tell me about yourself',
    'help me',
    'axon capabilities',
  ];

  const matches = selfQueries.some((q) => norm.includes(q)) || (norm.includes('who') && norm.includes('axon'));

  if (!matches) {
    return { matches: false, response: '' };
  }

  const response = `I am AXON — an AI-powered smart workspace crafted for mobile-first productivity and coding.\n\nHere is what I can do:\n• **Dual-Pane Interface**: Fluid split-view combining conversational AI with an interactive live workspace.\n• **Offline Math & Tools**: Instant arithmetic calculations, unit conversions, and built-in offline knowledge references.\n• **Storage Manifest Engine**: Proactive 15GB device budgeting with category breakdowns, lossy/lossless save modes, and synthetic quality restoration.\n• **Live Automation Rules**: Custom rules that trigger on rate limits, errors, or keywords with automated actions.\n• **Run Code Hooks**: Live script execution points for pre-prompt filtering and response modifications.\n• **Multi-Account AI Architecture**: Support for Gemini, Claude, ChatGPT, and local models with rate-limit cooldown isolation.`;

  return { matches: true, response };
}

export function detectAccountSwitchCommand(text: string): {
  isSwitchCommand: boolean;
  targetAccountLabel?: string;
} {
  const norm = text.trim().toLowerCase();
  const match = norm.match(/(?:switch\s+to|log\s+in\s+to|use\s+account)\s+(.+)/i);
  if (match) {
    return {
      isSwitchCommand: true,
      targetAccountLabel: match[1].trim(),
    };
  }
  return { isSwitchCommand: false };
}

export function buildAxonSystemInstruction(projectContext?: string): string {
  return `You are AXON, an AI-powered smartphone workspace and engineering assistant.
You provide concise, high-contrast, mathematically precise answers suitable for mobile viewports.
When code is requested, output clean, executable snippets.
${projectContext ? `Project Context: ${projectContext}` : ''}`;
}
