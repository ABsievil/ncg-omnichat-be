import { Injectable } from '@nestjs/common';
import { isArray, isEqual, isObject, sortBy } from 'lodash';
import { IHelperEqualObjectService } from 'src/common/helper/interfaces/helper.equal.object-service.interface';
import { MessageService } from 'src/common/message/services/message.service';

@Injectable()
export class HelperEqualObjectService implements IHelperEqualObjectService {
    constructor(private readonly messageService: MessageService) {}

    /**
     * @description Xử lý dữ liệu trước khi so sánh hai lịch
     */
    isEqualObject(a: Record<string, any>, b: Record<string, any>): boolean {
        const normalize = (obj: any): any => {
            if (isArray(obj)) {
                // Lọc các phần tử null/undefined
                const filtered = obj
                    .filter(item => item != null)
                    .map(normalize)
                    .filter(item => {
                        // Loại bỏ object rỗng và mảng rỗng
                        if (isArray(item)) return item.length > 0;
                        if (isObject(item)) return Object.keys(item).length > 0;
                        return true;
                    });

                return filtered.length > 0 ? sortBy(filtered) : undefined;
            }

            if (isObject(obj)) {
                const result = {};
                for (const key in obj) {
                    const val = obj[key];

                    // Bỏ qua các giá trị null, undefined, chuỗi rỗng
                    if (val == null || val === '') continue;

                    // Bỏ qua mảng rỗng
                    if (isArray(val) && val.length === 0) continue;

                    // Xử lý Date string và Date object
                    if (
                        typeof val === 'string' &&
                        /^\d{4}-\d{2}-\d{2}T/.test(val)
                    ) {
                        result[key] = new Date(val).getTime();
                    } else if (val instanceof Date) {
                        result[key] = val.getTime();
                    } else {
                        const normalizedVal = normalize(val);

                        // Chỉ thêm vào result nếu giá trị không rỗng
                        if (normalizedVal !== undefined) {
                            // Đối với object, kiểm tra xem có thuộc tính nào không
                            if (
                                isObject(normalizedVal) &&
                                Object.keys(normalizedVal).length === 0
                            ) {
                                continue;
                            }
                            result[key] = normalizedVal;
                        }
                    }
                }

                return Object.keys(result).length > 0 ? result : undefined;
            }

            return obj;
        };

        const normalizedA = normalize(a);
        const normalizedB = normalize(b);

        // Nếu cả hai đều rỗng sau khi normalize thì coi như bằng nhau
        if (normalizedA === undefined && normalizedB === undefined) {
            return true;
        }

        return isEqual(normalizedA, normalizedB);
    }
}
