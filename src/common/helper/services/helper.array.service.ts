import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { IHelperArrayService } from 'src/common/helper/interfaces/helper.array-service.interface';

@Injectable()
export class HelperArrayService implements IHelperArrayService {
    getByIndexFromLeft<T>(array: T[], index: number): T[] {
        return _.take(array, index + 1);
    }

    getByIndexFromRight<T>(array: T[], index: number): T[] {
        return _.takeRight(array, index + 1);
    }

    getDifference<T>(a: T[], b: T[]): T[] {
        return _.difference(a, b);
    }

    getIntersection<T>(a: T[], b: T[]): T[] {
        return _.intersection(a, b);
    }

    concat<T>(a: T[], b: T[]): T[] {
        return _.concat(a, b);
    }

    concatUnique<T>(a: T[], b: T[]): T[] {
        return _.union(a, b);
    }

    unique<T>(array: T[]): T[] {
        return _.uniq(array);
    }

    shuffle<T>(array: T[]): T[] {
        return _.shuffle(array);
    }

    equals<T>(a: T[], b: T[]): boolean {
        return _.isEqual(a, b);
    }

    notEquals<T>(a: T[], b: T[]): boolean {
        return !_.isEqual(a, b);
    }

    in<T>(a: T[], b: T[]): boolean {
        return _.intersection(a, b).length > 0;
    }

    notIn<T>(a: T[], b: T[]): boolean {
        return _.intersection(a, b).length === 0;
    }

    chunk<T>(a: T[], size: number): T[][] {
        return _.chunk<T>(a, size);
    }

    mapIdName<T = any>(
        items: T[] | undefined = [],
        nameKey: string = 'name'
    ): Array<{ _id: any; [key: string]: any }> {
        return (items || []).map((item: any) => ({
            _id: item?._id,
            [nameKey]: item?.[nameKey],
        }));
    }

    mapIdOnly<T = any>(items: T[] | undefined = []): Array<{ _id: any }> {
        return (items || []).map((item: any) => ({ _id: item?._id }));
    }

    mapWard<T = any>(
        items: T[] | undefined = []
    ): Array<{
        _id: any;
        name: string;
        code: string;
        provinceCode: string;
        provinceName: string;
    }> {
        return (items || []).map((item: any) => ({
            _id: item?._id,
            name: item?.name,
            code: item?.code,
            provinceCode: item?.provinceCode,
            provinceName: item?.provinceName,
        }));
    }
}
