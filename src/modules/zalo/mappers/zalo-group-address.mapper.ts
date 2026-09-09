import { ZALO_BOT_NAME_MATCH_MIN_LENGTH } from 'src/modules/zalo/constants/zalo.constant';
import { IZaloGroupAddressInput } from 'src/modules/zalo/interfaces/zalo.interface';

export function collectAccountNames(
  ...values: Array<string | null | undefined>
): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) {
      continue;
    }
    const key = normalizeForMatch(trimmed);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    names.push(trimmed);
  }

  return names;
}

export function extractAccountProfileNames(account: unknown): {
  userId?: string;
  displayName?: string;
  zaloName?: string;
  username?: string;
} {
  if (!account || typeof account !== 'object') {
    return {};
  }

  const raw = account as Record<string, unknown>;
  const nested =
    raw.profile && typeof raw.profile === 'object'
      ? (raw.profile as Record<string, unknown>)
      : undefined;
  const profile = nested ?? raw;

  return {
    userId: readProfileString(profile.userId ?? raw.userId),
    displayName: readProfileString(profile.displayName ?? raw.displayName),
    zaloName: readProfileString(profile.zaloName ?? raw.zaloName),
    username: readProfileString(profile.username ?? raw.username),
  };
}

function readProfileString(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text || undefined;
  }
  return undefined;
}

export function isGroupBotAddressed(input: IZaloGroupAddressInput): boolean {
  const ownId = input.identity.ownId?.trim();
  if (ownId && input.mentions?.some((mention) => mention.uid === ownId)) {
    return true;
  }

  const content = normalizeForMatch(input.messageContent);
  if (!content) {
    return false;
  }

  return input.identity.names.some((name) => {
    const normalizedName = normalizeForMatch(name);
    if (normalizedName.length < ZALO_BOT_NAME_MATCH_MIN_LENGTH) {
      return false;
    }
    if (
      content.includes(normalizedName) ||
      content.includes(`@${normalizedName}`)
    ) {
      return true;
    }

    const contentTokens = tokenizeForMatch(content);
    const nameTokens = tokenizeForMatch(normalizedName);
    return nameTokens.length === 1 && contentTokens.includes(nameTokens[0]);
  });
}

function tokenizeForMatch(value: string): string[] {
  return value.split(/[^a-z0-9]+/i).filter(Boolean);
}

export function stripBotAddressFromContent(
  content: string,
  names: string[],
): string {
  const original = content.trim();
  if (!original || !names.length) {
    return original;
  }

  const sorted = [...names]
    .map((name) => name.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  let result = original;
  for (const name of sorted) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`^@?${escaped}\\s*[,:]?\\s*`, 'iu'), '');
  }

  const stripped = result.trim();
  return stripped || original;
}

export function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ')
    .trim();
}
