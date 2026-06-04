import { Transform } from 'class-transformer';

const VIETNAM_TIMEZONE_OFFSET_MS = 7 * 60 * 60 * 1000;

export function DateToUtc() {
    return Transform(({ value }: { value: any }) => {
        if (!value) return value;

        try {
            let date: Date;

            if (value instanceof Date) {
                date = new Date(value);
            } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                date = new Date(value);
            } else {
                return value;
            }

            return new Date(date.getTime() - VIETNAM_TIMEZONE_OFFSET_MS);
        } catch {
            return value;
        }
    });
}
