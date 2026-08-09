export enum ENUM_ZALO_SESSION_STATUS {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING_QR = 'pending_qr',
  DISABLED = 'disabled',
}

export enum ENUM_ZALO_THREAD_TYPE {
  USER = 0,
  GROUP = 1,
}

export enum ENUM_ZALO_QR_EVENT_TYPE {
  QR = 0,
  EXPIRED = 1,
  SCANNED = 2,
  DECLINED = 3,
  GOT_LOGIN_INFO = 4,
}
