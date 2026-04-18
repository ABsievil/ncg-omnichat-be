import { registerAs } from '@nestjs/config';

export default registerAs('message', () => ({
  defaultLanguage: process.env.MESSAGE_DEFAULT_LANGUAGE ?? 'en',
  availableLanguages: (process.env.MESSAGE_AVAILABLE_LANGUAGES ?? 'en,vi')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}));
