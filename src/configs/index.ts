import appConfig from './app.config';
import aiConfig from './ai.config';
import databaseConfig from './database.config';
import debugConfig from './debug.config';
import encryptionConfig from './encryption.config';
import firebaseConfig from './firebase.config';
import helperConfig from './helper.config';
import middlewareConfig from './middleware.config';
import messageConfig from './message.config';
import pubsubConfig from './pubsub.config';
import r2Config from './r2.config';
import redisConfig from './redis.config';
import zaloConfig from './zalo.config';

export default [
  appConfig,
  databaseConfig,
  middlewareConfig,
  messageConfig,
  helperConfig,
  encryptionConfig,
  redisConfig,
  firebaseConfig,
  r2Config,
  pubsubConfig,
  debugConfig,
  zaloConfig,
  aiConfig,
];
