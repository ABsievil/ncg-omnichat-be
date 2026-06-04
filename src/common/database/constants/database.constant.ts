export const DATABASE_CONFIG_PATH = {
  ROOT: 'database',
  URL: 'database.url',
  DEBUG: 'database.debug',
  TIMEOUT_OPTIONS: 'database.timeoutOptions',
} as const;

export const DATABASE_AUDIT_FIELD = {
  DELETED_AT: 'deletedAt',
  CREATED_BY: 'createdBy',
  UPDATED_BY: 'updatedBy',
  DELETED_BY: 'deletedBy',
  DELETED: 'deleted',
  APPROVED_AT: 'approvedAt',
  APPROVED_BY: 'approvedBy',
  LOOKUP_CODE: 'lookupCode',
  BRANCH_ID: 'branchId',
} as const;

export { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.connection.constant';
export {
  DATABASE_CORE_PROVIDERS,
  DATABASE_OPTION_PROVIDERS,
} from 'src/common/database/constants/database.providers.constant';
