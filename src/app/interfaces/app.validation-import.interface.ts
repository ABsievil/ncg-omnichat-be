import type { ValidationError } from 'class-validator';

export interface IAppValidationImportErrorParam {
  sheetName?: string;
  row: number;
  errors: ValidationError[];
}
