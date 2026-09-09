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
    return (
      content.includes(normalizedName) || content.includes(`@${normalizedName}`)
    );
  });
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
