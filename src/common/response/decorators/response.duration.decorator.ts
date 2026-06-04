import { Transform } from 'class-transformer';
import { DateTime } from 'luxon';
import { requestContextStorage } from 'src/common/response/contexts/request-async-local-storage.context';

export function TransformFromDates(
    fromField: string,
    toField: string,
    dateFormat: string
) {
    return Transform(({ obj }) => {
        console.log('Data Object', obj);
        try {
            const context = requestContextStorage.getStore();
            const branchId = obj?.branchId || context?.branchId;
            const utc = Number(context?.timezoneAndLocale?.get(branchId)?.utc);
            const zone = `UTC${utc >= 0 ? '+' : ''}${utc}`;

            const fromDate = obj[fromField];
            const toDate = obj[toField];

            const from =
                fromDate &&
                fromDate instanceof Date &&
                !isNaN(fromDate.getTime())
                    ? DateTime.fromJSDate(fromDate, { zone }).toFormat(
                          dateFormat
                      )
                    : '';

            const to =
                toDate && toDate instanceof Date && !isNaN(toDate.getTime())
                    ? DateTime.fromJSDate(toDate, { zone }).toFormat(dateFormat)
                    : '';

            if (from && to) {
                return `${from} - ${to}`;
            } else if (from) {
                return from;
            } else if (to) {
                return to;
            } else {
                return '-';
            }
        } catch {
            return '-';
        }
    });
}
