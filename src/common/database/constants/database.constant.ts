import { IsExistsConstraint } from "../decorators/validations/database.exists.validation";
import { DatabaseIndexService } from "../services/database.index.service";
import { DatabaseOptionService } from "../services/database.options.service";
import { DatabaseService } from "../services/database.service";

export const DATABASE_CONNECTION_NAME = 'PrimaryConnectionDatabase';

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

export const DATABASE_OPTION_PROVIDERS = [DatabaseOptionService];
export const DATABASE_CORE_PROVIDERS = [
    DatabaseService,
    IsExistsConstraint,
    DatabaseIndexService,
];