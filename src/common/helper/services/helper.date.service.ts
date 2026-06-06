import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentData } from 'firebase-admin/firestore';
import { DateObjectUnits, DateTime, Duration } from 'luxon';
import { DEFAULT_LOCALE, DEFAULT_UTC } from 'src/app/constants/app.constant';
import { ENUM_HELPER_DATE_DAY_OF } from 'src/common/helper/enums/helper.enum';
import { IHelperDateService } from 'src/common/helper/interfaces/helper.date-service.interface';
import { IHelperDateCreateOptions } from 'src/common/helper/interfaces/helper.interface';

@Injectable()
export class HelperDateService implements IHelperDateService {
    private readonly defTz: string;

    constructor(private readonly configService: ConfigService) {
        this.defTz =
            this.configService.get<string>('app.timezone') ??
            `UTC+${DEFAULT_UTC}`;
    }

    calculateAge(dateOfBirth: Date, fromYear?: number): Duration {
        const dateTime = DateTime.now()
            .setZone(this.defTz)
            .plus({
                day: 1,
            })
            .set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            });
        const dateTimeDob = DateTime.fromJSDate(dateOfBirth)
            .setZone(this.defTz)
            .set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            });

        if (fromYear) {
            dateTime.set({
                year: fromYear,
            });
        }

        return dateTime.diff(dateTimeDob);
    }

    checkIso(date: string): boolean {
        return DateTime.fromISO(date).setZone(this.defTz).isValid;
    }

    checkTimestamp(timestamp: number): boolean {
        return DateTime.fromMillis(timestamp).setZone(this.defTz).isValid;
    }

    getZone(date: Date): string {
        return DateTime.fromJSDate(date).setZone(this.defTz).zone.name;
    }

    getZoneOffset(date: Date): string {
        return DateTime.fromJSDate(date).setZone(this.defTz).offsetNameShort;
    }

    getTimestamp(date: Date): number {
        return DateTime.fromJSDate(date).setZone(this.defTz).toMillis();
    }

    formatToRFC2822(date: Date): string {
        return DateTime.fromJSDate(date).setZone(this.defTz).toRFC2822();
    }

    formatToIso(date: Date): string {
        return DateTime.fromJSDate(date).setZone(this.defTz).toISO();
    }

    formatToIsoDate(date: Date): string {
        return DateTime.fromJSDate(date).setZone(this.defTz).toISODate();
    }

    formatToIsoTime(date: Date): string {
        return DateTime.fromJSDate(date).setZone(this.defTz).toISOTime();
    }

    getDateOnly(input: Date | string): string {
        const date =
            typeof input === 'string'
                ? DateTime.fromISO(input)
                : DateTime.fromJSDate(input);
        return date.setZone(this.defTz).toFormat('yyyy-MM-dd');
    }

    create(date?: Date, options?: IHelperDateCreateOptions): Date {
        const mDate = date
            ? DateTime.fromJSDate(date).setZone(this.defTz)
            : DateTime.now().setZone(this.defTz);

        if (
            options?.dayOf &&
            options?.dayOf === ENUM_HELPER_DATE_DAY_OF.START
        ) {
            mDate.startOf('day');
        } else if (
            options?.dayOf &&
            options?.dayOf === ENUM_HELPER_DATE_DAY_OF.END
        ) {
            mDate.endOf('day');
        }

        return mDate.toJSDate();
    }

    createInstance(date?: Date): DateTime {
        return date ? DateTime.fromJSDate(date) : DateTime.now();
    }

    createFromIso(iso: string, options?: IHelperDateCreateOptions): Date {
        let date = DateTime.fromISO(iso).setZone(this.defTz);

        if (
            options?.dayOf &&
            options?.dayOf === ENUM_HELPER_DATE_DAY_OF.START
        ) {
            date = date.startOf('day');
        } else if (
            options?.dayOf &&
            options?.dayOf === ENUM_HELPER_DATE_DAY_OF.END
        ) {
            date = date.endOf('day');
        }

        return date.toJSDate();
    }

    createFromTimestamp(
        timestamp?: number,
        options?: IHelperDateCreateOptions
    ): Date {
        const date = timestamp
            ? DateTime.fromMillis(timestamp).setZone(this.defTz)
            : DateTime.now().setZone(this.defTz);

        if (
            options?.dayOf &&
            options?.dayOf === ENUM_HELPER_DATE_DAY_OF.START
        ) {
            date.startOf('day');
        } else if (
            options?.dayOf &&
            options?.dayOf === ENUM_HELPER_DATE_DAY_OF.END
        ) {
            date.endOf('day');
        }

        return date.toJSDate();
    }

    set(date: Date, units: DateObjectUnits): Date {
        return DateTime.fromJSDate(date)
            .setZone(this.defTz)
            .set(units)
            .toJSDate();
    }

    forward(date: Date, duration: Duration): Date {
        return DateTime.fromJSDate(date)
            .setZone(this.defTz)
            .plus(duration)
            .toJSDate();
    }

    backward(date: Date, duration: Duration): Date {
        return DateTime.fromJSDate(date)
            .setZone(this.defTz)
            .minus(duration)
            .toJSDate();
    }

    /**
     * Lấy thời gian bắt đầu và kết thúc ngày hiện tại
     */
    getStartAndEndOfDay(date?: string): { startOfDay: Date; endOfDay: Date } {
        if (!date) {
            const today = new Date();
            const startOfDay = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
            );
            const endOfDay = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                23,
                59,
                59,
                999
            );
            return { startOfDay, endOfDay };
        }

        return {
            startOfDay: DateTime.fromISO(date)
                .setZone(this.defTz)
                .startOf('day')
                .toJSDate(),
            endOfDay: DateTime.fromISO(date)
                .setZone(this.defTz)
                .endOf('day')
                .toJSDate(),
        };
    }
    /**
     * Kiểm tra định dạng ngày hợp lệ. Định dạng: YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss
     */
    validateDate(date: string): boolean {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const isoDateTimeRegex =
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        return dateRegex.test(date) || isoDateTimeRegex.test(date);
    }

    getCurrentDate(): Date {
        return DateTime.now().setZone(this.defTz).toJSDate();
    }

    calculateDelayTime(time: Date): number {
        return time.getTime() - Date.now();
    }

    calculateDelayTimeInSeconds(time: Date): number {
        return Math.floor(this.calculateDelayTime(time) / 1000);
    }

    getTodayUTCTimeRange(): { startOfToday: Date; endOfToday: Date } {
        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setUTCHours(23, 59, 59, 999);

        return { startOfToday, endOfToday };
    }

    /**
     * Lấy tất cả các ngày trong khoảng từ fromDate đến toDate (trả về mảng Date objects)
     */
    getDatesInRange(fromDate: string | Date, toDate: string | Date): Date[] {
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);

        const dates: Date[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    }

    /**
     * Lấy danh sách ngày ở định dạng ISO (YYYY-MM-DD) trong khoảng fromDate -> toDate
     */
    getDateStringsInRange(
        fromDate: string | Date,
        toDate: string | Date
    ): string[] {
        return this.getDatesInRange(fromDate, toDate).map(date =>
            this.formatToIsoDate(date)
        );
    }

    convertToUTC(date: Date, offset: number): string {
        return DateTime.fromJSDate(date, { zone: 'utc' })
            .setZone(`UTC${offset >= 0 ? `+${offset}` : offset}`)
            .toISO();
    }

    /**
     * @description Lấy locale và utc của branch
     */
    getLocaleAndUtc(branch: DocumentData): {
        locale: string;
        utc: number;
    } {
        return {
            locale: branch?.locale?.locale || DEFAULT_LOCALE,
            utc: branch?.utc || DEFAULT_UTC,
        };
    }

    isSameMonthAndYear(date1: Date, date2: Date): boolean {
        const d1 = DateTime.fromJSDate(date1).setZone(this.defTz);
        const d2 = DateTime.fromJSDate(date2).setZone(this.defTz);
        return d1.year === d2.year && d1.month === d2.month;
    }

    startOfDay(date: Date): Date {
        return DateTime.fromJSDate(date)
            .setZone(this.defTz)
            .startOf('day')
            .toJSDate();
    }

    getStartAndEndDateOfMonth(
        date: Date,
        utc: number
    ): { startDate: Date; endDate: Date } {
        const utcOffset = utc >= 0 ? `+${utc}` : utc.toString();

        const start = DateTime.fromJSDate(date)
            .setZone(`UTC${utcOffset}`)
            .startOf('month')
            .toUTC();

        const end = DateTime.fromJSDate(date)
            .setZone(`UTC${utcOffset}`)
            .endOf('month')
            .toUTC();

        return {
            startDate: start.toJSDate(),
            endDate: end.toJSDate(),
        };
    }

    /**
     * @description Parse from/toDate từ query theo múi giờ chi nhánh
     */
    parseBranchDateRange(
        startDate: string | undefined,
        endDate: string | undefined,
        utcOffset: number
    ): [fromDate: Date, toDate: Date] {
        const zone = `UTC${utcOffset >= 0 ? `+${utcOffset}` : utcOffset}`;

        const fromLocal = startDate
            ? DateTime.fromISO(startDate, { zone }).startOf('day')
            : DateTime.now().setZone(zone).startOf('day');

        const toLocal = endDate
            ? DateTime.fromISO(endDate, { zone }).endOf('day')
            : fromLocal.endOf('day');

        // Chuyển về UTC để dùng chung trong hệ thống
        const fromDate = fromLocal.toUTC().toJSDate();
        const toDate = toLocal.toUTC().toJSDate();

        return [fromDate, toDate];
    }

    calculateEndTime(startTime: Date, duration: number): Date {
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + duration);
        return endTime;
    }

    /**
     * @description Format ra chuỗi yyyy-MM-dd theo múi giờ chi nhánh
     */
    formatBranchDate(date: Date, utcOffset: number): string {
        return DateTime.fromJSDate(date, {
            zone: `UTC${utcOffset >= 0 ? `+${utcOffset}` : utcOffset}`,
        }).toFormat('yyyy-MM-dd');
    }

    /**
     * @description Trả về thứ trong tuần (1 = Monday, 7 = Sunday) theo múi giờ chi nhánh.
     */
    getBranchWeekday(date: Date, utcOffset: number): number {
        const zone = `UTC${utcOffset >= 0 ? `+${utcOffset}` : utcOffset}`;
        return DateTime.fromJSDate(date, { zone }).weekday;
    }

    /**
     * @description Chuyển số giờ (float) sang chuỗi "HH:mm"
     */
    formatHourToTimeString(hour: number): string {
        const h = Math.floor(hour);
        const m = Math.round((hour % 1) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    /**
     * @description Lấy ngày cuối cùng của tháng (23:59:59.999)
     */
    toLastMonth(date: Date): Date {
        const dateTime = DateTime.fromJSDate(date).setZone(this.defTz);
        const lastDayOfMonth = dateTime.endOf('month');
        return lastDayOfMonth.toJSDate();
    }
}
