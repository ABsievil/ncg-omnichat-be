export const REQUEST_MESSAGE_KEY = {
    EMAIL_INVALID: 'request.email.invalid',
    EMAIL_MULTIPLE_AT: 'request.email.multipleAtSymbols',
    EMAIL_LOCAL_PART_EMPTY: 'request.email.localPartNotEmpty',
    EMAIL_DOMAIN_LENGTH: 'request.email.domainLength',
    EMAIL_LOCAL_PART_MAX_LENGTH: 'request.email.localPartMaxLength',
    EMAIL_LOCAL_PART_DOT: 'request.email.localPartDot',
    EMAIL_CONSECUTIVE_DOTS: 'request.email.consecutiveDots',
    EMAIL_INVALID_CHARS: 'request.email.invalidChars',
    EMAIL_DISPOSABLE: 'request.email.disposable',
    PASSWORD_WEAK: 'request.password.weak',
} as const;

export const AUTH_MESSAGE_KEY = {
    PASSWORD_NOT_MATCH: 'auth.error.passwordNotMatch',
} as const;
