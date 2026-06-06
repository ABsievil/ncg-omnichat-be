import { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';

export interface IHelperConvertFirebaseService {
    normalizeFirestoreDoc(
        doc: DocumentSnapshot,
        initialFields?: Record<string, any>
    ): Record<string, any>;

    normalizeFirestoreData(
        data: DocumentData | Record<string, any>,        initialFields?: Record<string, any>
    ): Record<string, any>;
}
