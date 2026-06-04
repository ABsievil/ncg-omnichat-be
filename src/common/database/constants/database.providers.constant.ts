import { IsExistsConstraint } from 'src/common/database/decorators/validations/database.exists.validation';
import { DatabaseIndexService } from 'src/common/database/services/database.index.service';
import { DatabaseOptionService } from 'src/common/database/services/database.options.service';
import { DatabaseService } from 'src/common/database/services/database.service';

export const DATABASE_OPTION_PROVIDERS = [DatabaseOptionService];

export const DATABASE_CORE_PROVIDERS = [
  DatabaseService,
  IsExistsConstraint,
  DatabaseIndexService,
];
