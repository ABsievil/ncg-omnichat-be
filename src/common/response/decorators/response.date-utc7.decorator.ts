import { Transform } from 'class-transformer';
import { Timestamp } from 'firebase-admin/firestore';

const VIETNAM_TIMEZONE_OFFSET_MS = 7 * 60 * 60 * 1000;

export function DateToUtc7() {
    return Transform(({ value }: { value: any }) => {
        if (!value) return value;

        try {
            let date: Date;

            if (value instanceof Date) {
                date = new Date(value);
            } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                date = new Date(value);
            } else if (
                value &&
                typeof value === 'object' &&
                '_seconds' in value &&
                '_nanoseconds' in value
            ) {
                const ts = new Timestamp(value._seconds, value._nanoseconds);
                date = ts.toDate();
            } else {
                return value;
            }

            return new Date(date.getTime() + VIETNAM_TIMEZONE_OFFSET_MS);
        } catch {
            return value;
        }
    });
}
