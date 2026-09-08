import {
  AutomationRule,
  RuleTriggerType,
  RuleActionType,
  RunCodeEntry,
} from '../types';

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-auto-retry',
    title: 'Auto-Retry on Connection Drop',
    description: 'Automatically re-dispatches the prompt if network disconnects or times out.',
    enabled: true,
    triggerType: 'connection_error',
    triggerLabel: 'Connection Issue or Network Failure',
    triggerCondition: 'Connection drops or request times out',
    actionType: 'retry_automatically',
    actionLabel: 'Retry Automatically',
    actionConfig: {
      maxRetries: 3,
    },
    plainLanguagePrompt: 'if a login or request fails because of connection issue, retry automatically',
    creationMode: 'plain_language',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    triggerCount: 0,
  },
  {
    id: 'rule-rate-limit-notice',
    title: 'Diagnostic Notice on Usage Limit',
    description: 'Displays a 24-hour diagnostic cooldown notice when rate limited (HTTP 429).',
    enabled: true,
    triggerType: 'rate_limit',
    triggerLabel: 'Usage Limit Reached (HTTP 429)',
    triggerCondition: 'Active account returns 429 Too Many Requests',
    actionType: 'notify_user',
    actionLabel: 'Notify User',
    actionConfig: {
      customMessage: 'Account rate limit reached. 24h cooldown timer active.',
    },
    plainLanguagePrompt: 'if an account hits usage limit, show diagnostic notice',
    creationMode: 'plain_language',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    triggerCount: 0,
  },
  {
    id: 'rule-code-highlight',
    title: 'Auto-Format Code Prompts',
    description: 'Instructs AXON to format code replies cleanly with syntax blocks.',
    enabled: true,
    triggerType: 'keyword_match',
    triggerLabel: 'Prompt Keyword Match',
    triggerCondition: 'Prompt contains code, python, or algorithm',
    actionType: 'auto_format_code',
    actionLabel: 'Auto-Format Code',
    actionConfig: {},
    plainLanguagePrompt: 'when prompt mentions code or function, format with syntax highlighting',
    creationMode: 'plain_language',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    triggerCount: 0,
  },
];

export const DEFAULT_RUN_CODE_ENTRIES: RunCodeEntry[] = [
  {
    id: 'rc-trim-whitespace',
    title: 'Prompt Whitespace Cleaner',
    description: 'Sanitizes and trims trailing newlines before dispatching to AI.',
    category: 'prompt_filter',
    hookPoint: 'pre_prompt',
    code: `// Pre-prompt hook
return input.trim();`,
    language: 'javascript',
    enabled: true,
    author: 'AXON Core',
    version: '1.0.0',
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function parsePlainLanguageRule(text: string): {
  title: string;
  description: string;
  triggerType: RuleTriggerType;
  triggerLabel: string;
  triggerCondition: string;
  actionType: RuleActionType;
  actionLabel: string;
  actionConfig: {
    maxRetries?: number;
    customMessage?: string;
    instructionPayload?: string;
  };
} {
  const norm = text.toLowerCase();

  let triggerType: RuleTriggerType = 'connection_error';
  let triggerLabel = 'Connection Issue or Network Failure';
  let triggerCondition = 'Connection drops or request times out';

  if (norm.includes('usage limit') || norm.includes('rate limit') || norm.includes('429')) {
    triggerType = 'rate_limit';
    triggerLabel = 'Usage Limit Reached (HTTP 429)';
    triggerCondition = 'Active account returns 429 Too Many Requests';
  } else if (norm.includes('code error') || norm.includes('script error') || norm.includes('exception')) {
    triggerType = 'code_execution_error';
    triggerLabel = 'Code Execution Error';
    triggerCondition = 'Script in AXON Code throws an unhandled exception';
  } else if (norm.includes('model error') || norm.includes('generation error')) {
    triggerType = 'model_error';
    triggerLabel = 'AI Model Generation Error';
    triggerCondition = 'API returns non-200 status or malformed response';
  } else if (norm.includes('keyword') || norm.includes('mentions') || norm.includes('contains')) {
    triggerType = 'keyword_match';
    triggerLabel = 'Prompt Keyword Match';
    triggerCondition = 'Prompt contains specific keyword';
  }

  let actionType: RuleActionType = 'retry_automatically';
  let actionLabel = 'Retry Automatically';
  const actionConfig: { maxRetries?: number; customMessage?: string; instructionPayload?: string } = {};

  if (norm.includes('retry')) {
    actionType = 'retry_automatically';
    actionLabel = 'Retry Automatically';
    actionConfig.maxRetries = 3;
  } else if (norm.includes('notify') || norm.includes('notice') || norm.includes('alert')) {
    actionType = 'notify_user';
    actionLabel = 'Notify User';
    actionConfig.customMessage = 'Rule triggered: notification sent.';
  } else if (norm.includes('format') || norm.includes('syntax')) {
    actionType = 'auto_format_code';
    actionLabel = 'Auto-Format Code';
  } else if (norm.includes('instruction') || norm.includes('append')) {
    actionType = 'append_instruction';
    actionLabel = 'Append Instruction';
    actionConfig.instructionPayload = 'Ensure response is concise and mathematically grounded.';
  }

  const title = `Rule: ${triggerLabel.split(' ')[0]} -> ${actionLabel}`;
  const description = `Automated action generated from: "${text}"`;

  return {
    title,
    description,
    triggerType,
    triggerLabel,
    triggerCondition,
    actionType,
    actionLabel,
    actionConfig,
  };
}

export async function executeRunCodeScript(
  entry: RunCodeEntry,
  input: string,
  context: { activeRulesCount?: number; activeRunCodeCount?: number; userModel?: string } = {}
): Promise<{ success: boolean; output: string; executionTimeMs: number; error?: string }> {
  const startTime = performance.now();
  try {
    // Safe execution of custom JS logic
    // eslint-disable-next-line no-new-func
    const fn = new Function('input', 'context', entry.code);
    const result = fn(input, context);
    const executionTimeMs = Math.round(performance.now() - startTime);

    const outputStr = typeof result === 'string' ? result : JSON.stringify(result ?? input);
    return {
      success: true,
      output: outputStr,
      executionTimeMs,
    };
  } catch (err: any) {
    const executionTimeMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      output: input,
      executionTimeMs,
      error: err?.message || 'Script execution error',
    };
  }
}
