import { Injectable } from '@nestjs/common';
import { IHelperConvertFirebaseService } from 'src/common/helper/interfaces/helper.convert.firebase-service.interface';

@Injectable()
export class HelperConvertFirebaseService
    implements IHelperConvertFirebaseService
{
    constructor() {}

    /**
     *@description Normalize Firestore document snapshot
     */
    normalizeFirestoreDoc(
        doc: FirebaseFirestore.DocumentSnapshot,
        initialFields?: Record<string, any>
    ): Record<string, any> {
        const data = doc.data() as FirebaseFirestore.DocumentData;
        if (!data) {
            return;
        }

        const normalized: Record<string, any> = { ...initialFields };
        for (const [key, value] of Object.entries(data)) {
            normalized[key] = this.convertFirestoreValue(value);
        }

        return normalized;
    }

    /**
     * @description Normalize Firestore data object
     */
    normalizeFirestoreData(
        data: FirebaseFirestore.DocumentData | Record<string, any>,
        initialFields?: Record<string, any>
    ): Record<string, any> {
        if (!data) {
            return;
        }

        const normalized: Record<string, any> = { ...initialFields };
        for (const [key, value] of Object.entries(data)) {
            normalized[key] = this.convertFirestoreValue(value);
        }

        return normalized;
    }

    /**
     * @description Convert Firestore value (Timestamp to Date)
     */
    private convertFirestoreValue(value: any): any {
        if (!value) {
            return value;
        }

        if (typeof value.toDate === 'function') {
            try {
                return value.toDate();
            } catch {
                return value;
            }
        }

        if (Array.isArray(value)) {
            return value.map(item => this.convertFirestoreValue(item));
        }

        if (typeof value === 'object' && value.constructor === Object) {
            const converted: Record<string, any> = {};
            for (const [key, val] of Object.entries(value)) {
                converted[key] = this.convertFirestoreValue(val);
            }
            return converted;
        }

        return value;
    }
}
