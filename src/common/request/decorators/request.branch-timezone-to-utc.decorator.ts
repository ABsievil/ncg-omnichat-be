import { Transform } from 'class-transformer';
import { ValidationOptions } from 'class-validator';
import { DateTime } from 'luxon';
import { requestContextStorage } from 'src/common/response/contexts/request-async-local-storage.context';

export function BranchTimezoneToUTC(
    options?: ValidationOptions
): PropertyDecorator {
    return Transform(({ value, obj, key }) => {
        if (!value) return value;

        const context = requestContextStorage.getStore();
        const branchId = obj?.branchId || context?.branchId;
        const offset = Number(context?.timezoneAndLocale?.get(branchId)?.utc);
        value = obj[key];

        if (isNaN(offset)) return value;

        const zone = `UTC${offset >= 0 ? '+' : ''}${offset}`;
        const convertOne = (v: any) => {
            if (!v) return v;
            if (typeof v !== 'string') return v;

            const date = DateTime.fromISO(v, { zone }).toUTC();
            if (!date.isValid) return v;
            return new Date(date.toISO());
        };

        if (Array.isArray(value)) {
            return value.map(convertOne);
        }
        return convertOne(value);
    }, options);
}
