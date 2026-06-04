export interface IHelperConvertFirebaseService {
    normalizeFirestoreDoc(
        doc: FirebaseFirestore.DocumentSnapshot,
        initialFields?: Record<string, any>
    ): Record<string, any>;

    normalizeFirestoreData(
        data: FirebaseFirestore.DocumentData | Record<string, any>,
        initialFields?: Record<string, any>
    ): Record<string, any>;
}
