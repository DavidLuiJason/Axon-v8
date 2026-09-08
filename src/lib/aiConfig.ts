import { AIAccount, AIModelOption } from '../types';

export const AVAILABLE_AI_MODELS: AIModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    providerName: 'Google',
    badge: 'Fast & Smart',
    description: 'High performance multimodal model optimized for real-time chat and workspace tasks.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    providerName: 'Google',
    badge: 'Reasoning',
    description: 'Complex reasoning, advanced coding synthesis, and architectural design.',
  },
  {
    id: 'axon-offline-core',
    name: 'AXON Local Core',
    provider: 'axon',
    providerName: 'AXON Engine',
    badge: 'Offline Safe',
    description: 'On-device local assistant capable of offline queries, calculations, and local scripts.',
  },
];

export const DEFAULT_AI_ACCOUNTS: AIAccount[] = [
  {
    id: 'account-axon-default',
    provider: 'gemini',
    label: 'Primary Gemini Account',
    apiKey: '',
    isActive: true,
    isRateLimited: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'account-axon-offline',
    provider: 'axon',
    label: 'AXON Offline Engine',
    apiKey: '',
    isActive: true,
    isRateLimited: false,
    createdAt: new Date().toISOString(),
  },
];

export function isAccountInCooldown(account?: AIAccount): boolean {
  if (!account || !account.cooldownUntil) return false;
  return Date.now() < account.cooldownUntil;
}

export function getRemainingCooldownString(accountOrCooldownUntil?: AIAccount | number): string {
  if (!accountOrCooldownUntil) return '';
  const cooldownUntil =
    typeof accountOrCooldownUntil === 'number'
      ? accountOrCooldownUntil
      : accountOrCooldownUntil.cooldownUntil;
  if (!cooldownUntil) return '';

  const remainingMs = cooldownUntil - Date.now();
  if (remainingMs <= 0) return '';
  const remainingMin = Math.ceil(remainingMs / (1000 * 60));
  if (remainingMin >= 60) {
    const hours = Math.floor(remainingMin / 60);
    const mins = remainingMin % 60;
    return `${hours}h ${mins}m`;
  }
  return `${remainingMin}m`;
}

export function findAccountByLabel(
  accounts: AIAccount[],
  label: string,
  preferredProvider?: string
): AIAccount | undefined {
  const norm = label.trim().toLowerCase();
  if (preferredProvider) {
    const matched = accounts.find(
      (a) =>
        a.provider === preferredProvider &&
        (a.label.toLowerCase() === norm || a.id.toLowerCase() === norm)
    );
    if (matched) return matched;
  }
  return accounts.find(
    (a) => a.label.toLowerCase() === norm || a.id.toLowerCase() === norm
  );
}
