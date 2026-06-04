export interface IHelperPhoneService {
    normalizePhoneNumber(phone: string): string;
    getPhoneNumberVariants(phone: string): string[];
}
