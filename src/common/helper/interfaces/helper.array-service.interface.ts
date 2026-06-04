export interface IHelperArrayService {
    getByIndexFromLeft<T>(array: T[], index: number): T[];
    getByIndexFromRight<T>(array: T[], index: number): T[];
    getDifference<T>(a: T[], b: T[]): T[];
    getIntersection<T>(a: T[], b: T[]): T[];
    concat<T>(a: T[], b: T[]): T[];
    concatUnique<T>(a: T[], b: T[]): T[];
    unique<T>(array: T[]): T[];
    shuffle<T>(array: T[]): T[];
    equals<T>(a: T[], b: T[]): boolean;
    notEquals<T>(a: T[], b: T[]): boolean;
    in<T>(a: T[], b: T[]): boolean;
    notIn<T>(a: T[], b: T[]): boolean;
    chunk<T>(a: T[], size: number): T[][];
    mapIdName<T = any>(
        items: T[] | undefined,
        nameKey?: string
    ): Array<{ _id: any; [key: string]: any }>;
    mapIdOnly<T = any>(items: T[] | undefined): Array<{ _id: any }>;
    mapWard<T = any>(
        items: T[] | undefined
    ): Array<{
        _id: any;
        name: string;
        code: string;
        provinceCode: string;
        provinceName: string;
    }>;
}
