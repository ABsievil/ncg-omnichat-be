import { IBotProfileSnapshot } from 'src/modules/bot-profile/interfaces/bot-profile.interface';

export interface IOmnichatBotRuntime {
  profile: IBotProfileSnapshot;
  now?: Date;
  skipDelay?: boolean;
}
