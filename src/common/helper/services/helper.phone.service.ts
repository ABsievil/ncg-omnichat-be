import { Injectable } from '@nestjs/common';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import {
    PHONE_COMMON_COUNTRY_CODES,
    PHONE_INTERNATIONAL_PREFIX,
    PHONE_NATIONAL_PREFIX,
} from 'src/common/helper/constants/phone.constants';
import { IHelperPhoneService } from 'src/common/helper/interfaces/helper.phone-service.interface';

@Injectable()
export class HelperPhoneService implements IHelperPhoneService {
    /**
     * @description Danh sách tất cả country codes từ libphonenumber-js
     * Sắp xếp theo độ dài (từ dài đến ngắn) để match chính xác nhất trước
     */
    public static readonly PHONE_COUNTRY_CODES: string[] = (() => {
        const countryCodesSet = new Set<string>();

        const countries = getCountries();
        countries.forEach(countryCode => {
            const callingCode = getCountryCallingCode(countryCode as any);
            if (callingCode) {
                countryCodesSet.add(callingCode);
            }
        });

        return Array.from(countryCodesSet).sort((a, b) => b.length - a.length);
    })();

    /**
     * @description Loại bỏ khoảng trắng và trim số điện thoại
     */
    private cleanPhone(phone: string): string {
        return phone.replace(/\s+/g, '').trim();
    }

    /**
     * @description Tìm country code từ chuỗi số (không có dấu +)
     */
    private findCountryCode(phoneWithoutPlus: string): {
        countryCode: string | null;
        nationalNumber: string;
    } {
        for (const code of HelperPhoneService.PHONE_COUNTRY_CODES) {
            if (
                phoneWithoutPlus.startsWith(code) &&
                phoneWithoutPlus.length > code.length
            ) {
                return {
                    countryCode: code,
                    nationalNumber: phoneWithoutPlus.substring(code.length),
                };
            }
        }

        return {
            countryCode: null,
            nationalNumber: phoneWithoutPlus,
        };
    }

    /**
     * @desciprition Trích xuất country code từ số điện thoại
     * @returns country code và phần số còn lại (national number)
     */
    private extractCountryCode(phone: string): {
        countryCode: string | null;
        nationalNumber: string;
    } {
        const cleaned = this.cleanPhone(phone);
        const phoneWithoutPlus = cleaned.startsWith(PHONE_INTERNATIONAL_PREFIX)
            ? cleaned.substring(1)
            : cleaned;

        return this.findCountryCode(phoneWithoutPlus);
    }

    /**
     * @description Chuẩn hóa số điện thoại về định dạng quốc tế (+country code + national number)
     */
    normalizePhoneNumber(phone: string): string {
        if (!phone) return '';

        const cleaned = this.cleanPhone(phone);

        if (cleaned.startsWith(PHONE_INTERNATIONAL_PREFIX)) {
            return cleaned;
        }

        const { countryCode, nationalNumber } =
            this.extractCountryCode(cleaned);

        if (countryCode) {
            return `${PHONE_INTERNATIONAL_PREFIX}${countryCode}${nationalNumber}`;
        }

        return cleaned;
    }

    /**
     * @description Tạo các biến thể của số điện thoại để tìm kiếm
     * Bao gồm: định dạng quốc tế (+XX...), không có + (XX...), và định dạng nội địa (0...)
     */
    getPhoneNumberVariants(phone: string): string[] {
        const cleaned = this.cleanPhone(phone);

        if (!cleaned) {
            return [];
        }

        const variants: string[] = [];
        const { countryCode, nationalNumber } =
            this.extractCountryCode(cleaned);

        if (countryCode) {
            this.addVariantsForCountryCode(
                variants,
                countryCode,
                nationalNumber
            );
        } else if (cleaned.startsWith(PHONE_NATIONAL_PREFIX)) {
            this.addFallbackVariants(variants, cleaned);
        } else {
            variants.push(cleaned);
        }

        return Array.from(new Set(variants.filter(Boolean)));
    }

    /**
     * @description Thêm các biến thể cho số điện thoại đã có country code
     */
    private addVariantsForCountryCode(
        variants: string[],
        countryCode: string,
        nationalNumber: string
    ): void {
        variants.push(
            `${PHONE_INTERNATIONAL_PREFIX}${countryCode}${nationalNumber}`,
            `${countryCode}${nationalNumber}`
        );

        if (
            nationalNumber &&
            !nationalNumber.startsWith(PHONE_NATIONAL_PREFIX)
        ) {
            variants.push(`${PHONE_NATIONAL_PREFIX}${nationalNumber}`);
        }
    }

    /**
     * @description Thêm các biến thể fallback khi không detect được country code
     * Sử dụng các country code phổ biến
     */
    private addFallbackVariants(
        variants: string[],
        normalizedPhone: string
    ): void {
        const withoutZero = normalizedPhone.substring(1);

        for (const code of PHONE_COMMON_COUNTRY_CODES) {
            variants.push(
                `${PHONE_INTERNATIONAL_PREFIX}${code}${withoutZero}`,
                `${code}${withoutZero}`
            );
        }

        variants.push(normalizedPhone);
    }
}
