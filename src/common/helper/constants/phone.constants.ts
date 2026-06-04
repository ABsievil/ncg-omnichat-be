// Các country code phổ biến dùng để fallback khi không detect được country code
export const PHONE_COMMON_COUNTRY_CODES = ['84', '1', '44', '86', '81', '82'];

// Regex pattern để extract country code từ số điện thoại
export const PHONE_COUNTRY_CODE_REGEX = /^(\d{1,3})(\d+)$/;

// Prefix cho định dạng quốc tế
export const PHONE_INTERNATIONAL_PREFIX = '+';

// Prefix cho định dạng nội địa (national format)
export const PHONE_NATIONAL_PREFIX = '0';
