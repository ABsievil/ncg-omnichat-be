import { DocumentData } from 'firebase-admin/firestore';
import { DateObjectUnits, DateTime, Duration } from 'luxon';
import { IHelperDateCreateOptions } from 'src/common/helper/interfaces/helper.interface';

export interface IHelperDateService {
    calculateAge(dateOfBirth: Date, fromYear?: number): Duration;
    checkIso(date: string): boolean;
    checkTimestamp(timestamp: number): boolean;
    getZone(date: Date): string;
    getTimestamp(date: Date): number;
    create(date?: Date, options?: IHelperDateCreateOptions): Date;
    createInstance(date?: Date): DateTime;
    createFromIso(iso: string, options?: IHelperDateCreateOptions): Date;
    createFromTimestamp(
        timestamp?: number,
        options?: IHelperDateCreateOptions
    ): Date;
    set(date: Date, units: DateObjectUnits): Date;
    forward(date: Date, duration: Duration): Date;
    backward(date: Date, duration: Duration): Date;
    validateDate(date: string): boolean;
    getDatesInRange(fromDate: string | Date, toDate: string | Date): Date[];
    convertToUTC(date: Date, utcOffset: number): string;
    getLocaleAndUtc(branch: DocumentData): {
        locale: string;
        utc: number;
    };
    isSameMonthAndYear(date1: Date, date2: Date): boolean;
    toLastMonth(date: Date): Date;
}
